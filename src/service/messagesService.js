import db from '../config/db.js';
import { CreateError } from '../middleware/createError.js';

// ─────────────────────────────────────────────────────────────────────────────
//  enqueueBulkMessages
//  Called by: messagesController → sendBulk
// ─────────────────────────────────────────────────────────────────────────────
export const enqueueBulkMessages = async ({ template_id, userId, messages }) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [templates] = await connection.query(
      `SELECT * FROM md_message_templates WHERE id = ?`,
      [template_id]
    );

    if (templates.length === 0) {
      throw CreateError(404, 'Template not found');
    }

    const template = templates[0];

    // Extract template variables
    const matches = template.body.match(/{{(.*?)}}/g) || [];
    const requiredVars = [...new Set(matches.map(v => v.replace(/[{}]/g, '').trim()))];

    const insertedQueueIds = [];

    // Process each message
    for (const item of messages) {
      const [prospects] = await connection.query(
        `SELECT
          id,
          contact_name,
          company_name,
          email,
          phone
        FROM md_prospects
        WHERE id = ?`,
        [item.prospect_id]
      );

      if (prospects.length === 0) {
        throw CreateError(404, `Prospect not found: ${item.prospect_id}`);
      }

      const prospect = prospects[0];

      // Prospect data
      const prospectData = {
        name: prospect.contact_name,
        company_name: prospect.company_name,
        email: prospect.email,
        phone: prospect.phone
      };

      // Merge payload
      const finalPayload = { ...prospectData, ...(item.payload || {}) };

      // Validate template variables
      for (const variable of requiredVars) {
        if (!(variable in finalPayload)) {
          throw CreateError(400, `Missing variable: ${variable} for prospect ${item.prospect_id}`);
        }
      }

      // Determine recipient
      let toAddress = null;
      if (template.channel === 'EMAIL') toAddress = prospect.email;
      if (template.channel === 'SMS' || template.channel === 'WHATSAPP') toAddress = prospect.phone;

      if (!toAddress) {
        throw CreateError(400, `Recipient not found for prospect ${item.prospect_id}`);
      }

      // Insert queue record
      const [result] = await connection.query(
        `INSERT INTO td_messages_queue (
          prospect_id,
          channel,
          template_id,
          to_address,
          payload,
          created_by,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          prospect.id,
          template.channel,
          template.id,
          toAddress,
          JSON.stringify(finalPayload),
          userId
        ]
      );

      insertedQueueIds.push(result.insertId);
    }

    await connection.commit();

    return {
      total_messages: insertedQueueIds.length,
      queue_ids: insertedQueueIds,
      status: 'PENDING'
    };

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  enqueueMessage  (single)
//  Called by: messagesController → sendSingle
// ─────────────────────────────────────────────────────────────────────────────
export const enqueueMessage = async ({ template_id, prospect_id, payload = {}, userId }) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        t.id AS template_id,
        t.channel,
        t.body,
        p.id AS prospect_id,
        p.contact_name,
        p.company_name,
        p.email,
        p.phone
      FROM md_message_templates t
      INNER JOIN md_prospects p ON p.id = ?
      WHERE t.id = ?`,
      [prospect_id, template_id]
    );

    if (rows.length === 0) {
      throw CreateError(404, 'Template or Prospect not found');
    }

    const data = rows[0];

    // Extract variables from template
    const matches = data.body.match(/{{(.*?)}}/g) || [];
    const requiredVars = [...new Set(matches.map(v => v.replace(/[{}]/g, '').trim()))];

    // Prospect based variables
    const prospectData = {
      name: data.contact_name,
      company_name: data.company_name,
      email: data.email,
      phone: data.phone
    };

    // Merge prospect data + dynamic payload
    const finalPayload = { ...prospectData, ...payload };

    // Validate template variables
    for (const variable of requiredVars) {
      if (!(variable in finalPayload)) {
        throw CreateError(400, `Missing variable: ${variable}`);
      }
    }

    // Determine recipient automatically
    let toAddress = null;
    if (data.channel === 'EMAIL') toAddress = data.email;
    if (data.channel === 'SMS' || data.channel === 'WHATSAPP') toAddress = data.phone;

    if (!toAddress) {
      throw CreateError(400, 'Recipient address not found');
    }

    const [result] = await connection.query(
      `INSERT INTO td_messages_queue (
        prospect_id,
        channel,
        template_id,
        to_address,
        payload,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        data.prospect_id,
        data.channel,
        data.template_id,
        toAddress,
        JSON.stringify(finalPayload),
        userId
      ]
    );

    await connection.commit();

    return {
      queue_id: result.insertId,
      status: 'PENDING',
      message: 'Message queued successfully'
    };

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  queue
//  Called by: messagesController → queue
// ─────────────────────────────────────────────────────────────────────────────
export const queue = async ({ channel, prospect_id, limit, offset }) => {
  let baseQuery = `FROM td_messages_queue WHERE 1=1`;
  let values = [];

  if (channel && channel.length > 0) {
    baseQuery += ` AND channel IN (${channel.map(() => '?').join(',')})`;
    values.push(...channel);
  }

  if (prospect_id && prospect_id.length > 0) {
    baseQuery += ` AND prospect_id IN (${prospect_id.map(() => '?').join(',')})`;
    values.push(...prospect_id);
  }

  const [[countResult]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    values
  );

  const [rows] = await db.query(
    `SELECT
      id,
      channel,
      prospect_id,
      template_id,
      to_address,
      status,
      retry_count,
      scheduled_at,
      sent_at,
      created_at
    ${baseQuery}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return { rows, total: countResult.total };
};

// ─────────────────────────────────────────────────────────────────────────────
//  postTemplates
//  Called by: messagesController → postTemplates
// ─────────────────────────────────────────────────────────────────────────────
export const postTemplates = async ({ templateCode, channel, language_id, subject, body }) => {
  const matches = body.match(/{{(.*?)}}/g) || [];
  const variables = [...new Set(matches.map(v => v.replace(/[{}]/g, '').trim()))];

  const [result] = await db.query(
    `INSERT INTO md_message_templates
     (template_code, language_id, channel, subject, body, variables)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [templateCode, language_id, channel, subject, body, JSON.stringify(variables)]
  );

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
//  updateTemplates
//  Called by: messagesController → updateTemplates
// ─────────────────────────────────────────────────────────────────────────────
export const updateTemplates = async ({ id, data }) => {
  const { subject, body } = data;

  const [rows] = await db.query(
    `SELECT id FROM md_message_templates WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const matches = body.match(/{{(.*?)}}/g) || [];
  const variables = [...new Set(matches.map(v => v.replace(/[{}]/g, '').trim()))];

  await db.query(
    `UPDATE md_message_templates
     SET subject = ?, body = ?, variables = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [subject || null, body, JSON.stringify(variables), id]
  );

  return { success: true, message: 'Template updated successfully' };
};

// ─────────────────────────────────────────────────────────────────────────────
//  getTemplates
//  Called by: messagesController → getTemplates
// ─────────────────────────────────────────────────────────────────────────────
export const getTemplates = async ({ templateCode, channel, language_id, limit, offset }) => {
  let baseQuery = `FROM md_message_templates WHERE 1=1`;
  let values = [];

  if (templateCode) {
    baseQuery += ` AND template_code = ?`;
    values.push(templateCode);
  }

  if (channel && channel.length > 0) {
    baseQuery += ` AND channel IN (${channel.map(() => '?').join(',')})`;
    values.push(...channel);
  }

  if (language_id) {
    baseQuery += ` AND language_id = ?`;
    values.push(language_id);
  }

  const [[countResult]] = await db.query(
    `SELECT COUNT(*) as total ${baseQuery}`,
    values
  );

  const [rows] = await db.query(
    `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return { total: countResult.total, templates: rows };
};