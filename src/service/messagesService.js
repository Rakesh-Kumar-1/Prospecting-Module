import db from '../config/db.js';
import { CreateError } from '../middleware/createError.js';

export const enqueueBulkMessages = async ({ template_id, userId, messages }) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [templates] = await connection.query(`SELECT *FROM md_message_templates WHERE id = ?`, [template_id]);
    if (templates.length === 0) {
      throw CreateError(404, 'Template not found');
    }

    const template = templates[0];

    let requiredVars = [];
    if (Array.isArray(template.variables)) {
      requiredVars = template.variables;
    } else {
      requiredVars = JSON.parse(template.variables || '[]');
    }

    const insertedQueueIds = [];
    // Process each message
    for (const item of messages) {
      const [prospects] = await connection.query(
        `
        SELECT
          id,
          contact_name,
          company_name,
          email,
          phone
        FROM md_prospects
        WHERE id = ?
        `,
        [item.prospect_id]
      );

      if (prospects.length === 0) {
        throw CreateError(404, `Prospect not found: ${item.prospect_id}`);
      }

      const prospect = prospects[0];

      // Prospect data
      const prospectData = {
        company_name: prospect.company_name,
        contact_name: prospect.contact_name,
        email: prospect.email,
        phone: prospect.phone
      };

      const customVars = requiredVars.filter(
        variable => !(variable in prospectData)
      );

      for (const variable of customVars) {
        if (
          item.payload?.[variable] === undefined ||
          item.payload?.[variable] === null ||
          item.payload?.[variable] === ''
        ) {
          throw CreateError(400, `Missing payload variable: ${variable} for prospect ${item.prospect_id}`);
        }
      }
      // Merge payload
      const finalPayload = { ...prospectData, ...(item.payload || {}) };

      // Determine recipient
      let toAddress = data.channel === 'EMAIL' ? data.email : data.phone;

      if (!toAddress) {
        throw CreateError(400, `Recipient not found for prospect ${item.prospect_id}`);
      }

      // Insert queue record
      const [result] = await connection.query(
        `
        INSERT INTO td_messages_queue (
          prospect_id,
          channel,
          template_id,
          to_address,
          payload,
          created_by,
          status
        ) VALUES (?, ?, ?, ?, ?, ?,'PENDING')
        `,
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

    // Commit transaction
    await connection.commit();

    return {
      total_messages: insertedQueueIds.length,
      queue_ids: insertedQueueIds,
      status: 'PENDING'
    };

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const enqueueMessage = async ({ template_id, prospect_id, payload = {}, userId }) => {
  console.log(template_id, prospect_id, payload, userId);
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Fetch template + prospect using JOIN
    const [rows] = await connection.query(`SELECT
        t.id AS template_id,
        t.channel,
        t.body,
        t.variables,
        p.id AS prospect_id,
        p.contact_name,
        p.company_name,
        p.email,
        p.phone
      FROM md_message_templates t INNER JOIN md_prospects p ON p.id = ?
      WHERE t.id = ?
      `, [prospect_id, template_id]);

    if (rows.length === 0) {
      throw CreateError(404, 'Template or Prospect not found');
    }

    const data = rows[0];

    let requiredVars = [];

    if (Array.isArray(data.variables)) {
      requiredVars = data.variables;
    } else {
      requiredVars = JSON.parse(data.variables || '[]');
    }

    // Prospect based variables
    const prospectData = {
      contact_name: data.contact_name,
      company_name: data.company_name,
      email: data.email,
      phone: data.phone
    };
    const customVars = requiredVars.filter(
      variable => !(variable in prospectData)
    );

    /*
      Validate payload variables only
    */
    for (const variable of customVars) {

      if (
        payload[variable] === undefined ||
        payload[variable] === null ||
        payload[variable] === ''
      ) {
        throw CreateError(400, `Missing payload variable: ${variable}`);
      }
    }
    // Merge prospect data + dynamic payload
    const finalPayload = { ...prospectData, ...payload };

    // Determine recipient automatically
    let toAddress = data.channel === 'EMAIL' ? data.email : data.phone;
    if (!toAddress) {
      throw CreateError(400, 'Recipient address not found');
    }

    // Insert message into queue
    const [result] = await connection.query(`
      INSERT INTO td_messages_queue (
        prospect_id,
        channel,
        template_id,
        to_address,
        payload,
        userId,
        status
      ) VALUES (?, ?, ?, ?, ?,?, 'PENDING')
      `,
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

    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const queue = async ({ channel, prospect_id, limit, offset }) => {
  let baseQuery = `FROM td_messages_queue WHERE 1=1`;
  let values = [];

  // Channel filter
  if (channel && channel.length > 0) {
    baseQuery += ` AND channel IN (${channel.map(() => '?').join(',')})`;
    values.push(...channel);
  }

  // prospect_id filter
  if (prospect_id && prospect_id.length > 0) {
    baseQuery += ` AND prospect_id IN (${prospect_id.map(() => '?').join(',')})`;
    values.push(...prospect_id);
  }

  // Count query
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const [[countResult]] = await db.query(countQuery, values);

  // Data query
  const dataQuery = `
    SELECT 
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
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(dataQuery, [...values, limit, offset]);
  return { rows, total: countResult.total };
};

export const postTemplates = async ({ templateCode, channel, language_id, subject, body }) => {
  try {

    // Extract variables from body ({{variable}})
    const matches = body.match(/{{(.*?)}}/g) || [];

    // Clean and deduplicate
    const variables = [...new Set(
      matches.map(v => v.replace(/[{}]/g, '').trim())
    )];

    const query = `
      INSERT INTO md_message_templates
      (template_code, language_id, channel, subject, body, variables)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      templateCode,
      language_id,
      channel,
      subject,
      body,
      JSON.stringify(variables)
    ];
    const [result] = await db.query(query, values);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTemplates = async ({ id, data }) => {
  try {
    const { subject, body } = data;
    const [rows] = await db.query("SELECT id FROM md_message_templates WHERE id = ?", [id]);

    if (rows.length === 0) {
      return rows;
    }

    const matches = body.match(/{{(.*?)}}/g) || [];

    const variables = [...new Set(
      matches.map(v => v.replace(/[{}]/g, '').trim())
    )];

    const query = `
      UPDATE md_message_templates
      SET 
        subject = ?,
        body = ?,
        variables = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      subject || null,
      body,
      JSON.stringify(variables),
      id
    ];

    await db.query(query, values);

    return { success: true, message: "Template updated successfully", };
  } catch (error) {
    throw error;
  }
}

export const getTemplates = async ({ templateCode, channel, language_id, limit, offset }) => {
  try {
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

    // Total count query
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [[countResult]] = await db.query(countQuery, values);

    // Data query with pagination
    const dataQuery = `SELECT * ${baseQuery}ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await db.query(dataQuery, [...values, limit, offset]);
    return {
      total: countResult.total,
      templates: rows
    }
  }
  catch (err) {
    throw err;
  }
};
