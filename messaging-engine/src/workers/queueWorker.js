require('dotenv').config();
const db = require('../db/connection');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const logger = require('../db/logger');
const config = require('../config');

// ─────────────────────────────────────────
// Writes a record into td_message_logs
// ─────────────────────────────────────────
const logDelivery = async (queueRow, result, status, attemptNumber) => {
  try {
    await db.query(
      `INSERT INTO td_message_logs
       (queue_id, channel, to_address, provider,
        provider_msg_id, status_code, response_body,
        delivered_at, attempt_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queueRow.id,
        queueRow.channel,
        queueRow.to_address,
        result?.provider || null,
        result?.messageId || null,
        result?.statusCode || result?.status || null,
        result ? JSON.stringify(result) : null,
        status === 'SENT' ? new Date() : null,
        attemptNumber,
      ]
    );
  } catch (logErr) {
    logger.error(`[WORKER] Failed to write td_message_logs: ${logErr.message}`);
  }
};

// ─────────────────────────────────────────
// Routes the message to SMS or Email provider
// ─────────────────────────────────────────
const routeToProvider = async (msg) => {
  let payload;
  if (typeof msg.payload === 'string') {
    payload = JSON.parse(msg.payload);
  } else if (typeof msg.payload === 'object') {
    payload = msg.payload;
  } else {
    throw new Error(`Invalid payload type: ${typeof msg.payload}`);
  }

  switch (msg.channel) {
    case 'EMAIL':
      return sendEmail(msg.to_address, payload.subject, payload.body);
    case 'SMS':
      return sendSMS(msg.to_address, payload.body);
    default:
      throw new Error(`UNKNOWN_CHANNEL: ${msg.channel}`);
  }
};

// ─────────────────────────────────────────
// Checks if the error is an auth/connection error
// If yes, skip retries and mark as FAILED immediately
// ─────────────────────────────────────────
const isAuthError = (err) =>
  err.message.includes('535') ||
  err.message.includes('Authentication') ||
  err.message.includes('Invalid login') ||
  err.message.includes('ECONNREFUSED');

// ─────────────────────────────────────────
// Main queue processor
// ─────────────────────────────────────────
const processQueue = async () => {
  try {
    // STEP 1 — Fetch all PENDING messages that are due
    const [messages] = await db.query(
      `SELECT * FROM td_message_queue
       WHERE status = 'PENDING'
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())
       ORDER BY created_at ASC
       LIMIT 50`
    );

    if (messages.length === 0) return;

    logger.info(`[WORKER] Processing ${messages.length} messages`);

    for (const msg of messages) {

      // STEP 2 — Lock the message by marking it as PROCESSING
      // If affectedRows === 0, another worker already picked it up
      const [locked] = await db.query(
        `UPDATE td_message_queue
         SET status = 'PROCESSING', last_attempt_at = NOW()
         WHERE id = ? AND status = 'PENDING'`,
        [msg.id]
      );

      if (locked.affectedRows === 0) continue;

      // STEP 3 — Log the attempt start BEFORE calling the provider
      // This ensures every attempt is tracked even if the worker crashes mid-send
      await db.query(
        `INSERT INTO td_message_logs
         (queue_id, channel, to_address, provider,
          provider_msg_id, status_code, response_body,
          delivered_at, attempt_number)
         VALUES (?, ?, ?, NULL, NULL, 'ATTEMPTING', NULL, NULL, ?)`,
        [msg.id, msg.channel, msg.to_address, msg.retry_count + 1]
      );

      try {
        // STEP 4 — Send the message via SMS or Email provider
        const result = await routeToProvider(msg);

        // STEP 5 (SUCCESS) — Mark as SENT in the queue
        await db.query(
          `UPDATE td_message_queue
           SET status = 'SENT', sent_at = NOW(), error_message = NULL
           WHERE id = ?`,
          [msg.id]
        );

        // STEP 6 (SUCCESS) — Write success entry to logs
        await logDelivery(msg, result, 'SENT', msg.retry_count + 1);

        // STEP 7 (SUCCESS) — Remove from queue, job is done
        await db.query(
          `DELETE FROM td_message_queue WHERE id = ? AND status = 'SENT'`,
          [msg.id]
        );

        logger.info(
          `[WORKER] ✅ SENT & DELETED | ID: ${msg.id} | ${msg.channel} → ${msg.to_address}`
        );

      } catch (sendErr) {
        // STEP 5 (FAIL) — Increment retry count
        const newRetryCount = msg.retry_count + 1;

        // Auth/connection error or max retries reached = permanent FAILED
        // Otherwise keep as PENDING and schedule retry with exponential backoff
        let finalStatus;
        let nextScheduledAt = null;

        if (isAuthError(sendErr) || newRetryCount >= msg.max_retries) {
          finalStatus = 'FAILED';
        } else {
          finalStatus = 'PENDING';
          // Exponential backoff: 2min, 4min, 8min between retries
          const backoffMinutes = Math.pow(2, newRetryCount);
          nextScheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        }

        // STEP 6 (FAIL) — Update queue with new status and next retry time
        await db.query(
          `UPDATE td_message_queue
           SET status = ?,
               retry_count = ?,
               error_message = ?,
               scheduled_at = ?
           WHERE id = ?`,
          [finalStatus, newRetryCount, sendErr.message, nextScheduledAt, msg.id]
        );

        // STEP 7 (FAIL) — Write failure entry to logs
        await logDelivery(msg, null, 'FAILED', newRetryCount);

        logger.error(
          `[WORKER] ❌ FAILED | ID: ${msg.id} | Attempt ${newRetryCount}/${msg.max_retries} | Status: ${finalStatus} | ${sendErr.message}`
        );
      }
    }
  } catch (err) {
    logger.error(`[WORKER] Queue processing error: ${err.message}`);
  }
};

// ─────────────────────────────────────────
// Start the worker
// ─────────────────────────────────────────
logger.info(`[WORKER] 🚀 Started — polling every ${config.worker.pollMs}ms`);
setInterval(processQueue, config.worker.pollMs);

process.on('SIGTERM', () => {
  logger.info('[WORKER] SIGTERM received, shutting down...');
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGINT', () => {
  logger.info('[WORKER] SIGINT received, shutting down...');
  setTimeout(() => process.exit(0), 2000);
});