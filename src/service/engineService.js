import db from '../config/db.js';
import os from 'os';
import {sendEmail} from "../utils/sendEmail.js";
import {sendSMS} from "../utils/sendSMS.js";
import {sendWhatsapp} from "../utils/sendWhatsapp.js";
const WORKER_ID = `${os.hostname()}-${process.pid}`;
const MAX_RETRY = 3;
export const resetStuckJobs = async () => {
    try {
        const [result] = await db.query(`
         UPDATE td_messages_queue
         SET
            status = 'PENDING',
            locked_by = NULL,
            locked_at = NULL
         WHERE status = 'PROCESSING'
         AND locked_by IS NOT NULL
         AND locked_at < NOW() - INTERVAL 15 MINUTE
         
      `);

        if (result.affectedRows > 0) {
            console.log(`Reset ${result.affectedRows} stuck jobs`);
        }

    } catch (err) {

        console.log('Reset Job Error:', err);
    }
};

export const processQueue = async () => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [messages] = await connection.query(`
         SELECT *
         FROM td_messages_queue
         WHERE status = 'PENDING'
         AND retry_count < ?
         ORDER BY created_at ASC
         LIMIT 50
         FOR UPDATE SKIP LOCKED`, [MAX_RETRY]);

        if (messages.length === 0) {
            await connection.commit();
            console.log('No pending messages');
            return;
        }
        const ids = messages.map(msg => msg.id);
        await connection.query(`
            UPDATE td_messages_queue
            SET
                status = 'PROCESSING',
                locked_by = ?,
                locked_at = NOW()
            WHERE id IN (?) `, [WORKER_ID, ids]);
        await connection.commit();
        console.log(`Locked ${ids.length} messages`);
        const successIds = [];
        const failedIds = [];
        const logs = [];
        for (const msg of messages) {
            try {
                let response = null;
                if (msg.channel === 'EMAIL') {
                    response = await sendEmail({to:msg.to_address ,subject:msg.subject,body:msg.body});
                } else if (msg.channel === 'SMS') {
                    response = await sendSMS({body:msg.body,to_address:msg.to_address});
                } else {
                    response = await sendWhatsapp({body:msg.body,to_address:msg.to_address});
                }
                successIds.push(msg.id);
                logs.push([
                    msg.id,
                    msg.channel,
                    'SUCCESS',
                    response?.provider || null,
                    response?.messageId || null,
                    null,
                    JSON.stringify(response || {})
                ]);

            } catch (err) {
                failedIds.push(msg.id);
                logs.push([
                    msg.id,
                    msg.channel,
                    'FAILED',
                    null,
                    null,
                    err.message,
                    null
                ]);
            }
        }

        if (successIds.length > 0) {
            await connection.query(`
        UPDATE td_messages_queue
        SET
            status = 'SENT',
            processed_at = NOW(),
            locked_by = NULL,
            locked_at = NULL
        WHERE id IN (?)`, [successIds]);
        }
        if (failedIds.length > 0) {
            await connection.query(`
            UPDATE td_messages_queue
            SET
                retry_count = retry_count + 1,
                status = CASE
                    WHEN retry_count + 1 >= ?
                    THEN 'FAILED'
                    ELSE 'PENDING'
                END,
                locked_by = NULL,
                locked_at = NULL,
                error_message = 'Message sending failed'
            WHERE id IN (?)
            
         `, [MAX_RETRY, failedIds]);
        }
        if (logs.length > 0) {
            await connection.query(`
            INSERT INTO td_message_logs (
               queue_id,
               channel,
               status,
               provider,
               provider_message_id,
               error_message,
               response_body
            )
            VALUES ?
         `, [logs]);
        }
        console.log('Queue processing completed');
    } catch (err) {
        console.log('Worker Error:', err);
        if (connection) {
            await connection.rollback();
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};