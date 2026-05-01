import db from '../config/db.js';
<<<<<<< HEAD


export const sendBulkMessages = async ({templateCode, channel, prospectIds, overrideVars = {}, scheduledAt, userId}) => {
    try {
        // 🔹 1. Fetch prospects
        const [prospects] = await db.query(
            `SELECT id, email, phone, preferred_lang_id, contact_name, company_name 
             FROM prospects WHERE id IN (?)`,
            [prospectIds]
        );

        if (!prospects.length) {
            return { queued: 0, skipped: prospectIds.length };
        }

        // 🔹 2. Fetch templates (multi-language)
        const [templates] = await db.query(
            `SELECT id, language_id, subject, body
             FROM message_templates
             WHERE template_code = ?
               AND channel = ?
               AND is_active = true`,
            [templateCode, channel]
        );

        if (!templates.length) {
            throw new Error("TEMPLATE_NOT_FOUND");
        }

        // 🔹 3. Map templates by language
        const templateMap = {};
        templates.forEach(t => {
            templateMap[t.language_id] = t;
        });

        let skipped = 0;
        const rows = [];

        // 🔹 4. Process each prospect
        for (const p of prospects) {

            // ✅ Pick template (with fallback)
            const tmpl = templateMap[p.preferred_lang_id] || templateMap['EN'];
            if (!tmpl) {
                skipped++;
                continue;
            }

            // ✅ Get receiver
            const toAddress = channel === 'EMAIL' ? p.email : p.phone;

            if (!toAddress) {
                skipped++;
                continue;
            }

            // ✅ Merge variables
            const vars = {
                name: p.contact_name || '',
                company: p.company_name || '',
                ...overrideVars
            };

            // ✅ Replace variables
            let body = tmpl.body;
            let subject = tmpl.subject || '';

            for (const key in vars) {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                body = body.replace(regex, vars[key]);
                subject = subject.replace(regex, vars[key]);
            }

            // ✅ Build payload
            const payload = JSON.stringify({ subject, body });

            // ✅ Push row
            rows.push([
                channel,
                p.id,
                tmpl.id,
                toAddress,
                payload,
                'PENDING',
                0,
                3,
                null,
                scheduledAt || null,
                null,
                null,
                userId
            ]);
        }

        // 🔹 5. Bulk insert
        if (rows.length > 0) {
            await db.query(
                `INSERT INTO message_queue
                (channel, prospect_id, template_id, to_address, payload,
                 status, retry_count, max_retries, last_attempt_at,
                 scheduled_at, sent_at, error_message, created_by)
                VALUES ?`,
                [rows]
            );
        }

        // 🔹 6. Return summary
        return {
            queued: rows.length,
            skipped
        };

    } catch (error) {
        throw error;
    }
}

export const sendSingle = async (status_code, lng_id, title) => {
    try {
        const query = `INSERT INTO mt_mkt_budget_status (status_code, lng_id, title) VALUES (?, ?, ?)`;
        const values = [status_code, lng_id, title];
        const [rows] = await db.query(query, values);
        return rows;
    } catch (error) {
        throw error;
    }
}

export const queue = async (id, args) => {
    try {

    } catch (error) {
        throw error;
    }
}

export const postTemplates = async (status_code, lng_id) => {
    try {
        const query = `SELECT * FROM mt_mkt_budget_status WHERE status_code = ? AND lng_id = ?`;
        const values = [status_code, lng_id];
        const [rows] = await db.query(query, values);
        return rows;
    } catch (error) {
        throw error;
    }
}

export const updateTemplates = async (status_code, lng_id, title) => {
    try {
        const query = `INSERT INTO mt_mkt_budget_status (status_code, lng_id, title) VALUES (?, ?, ?) 
                       ON DUPLICATE KEY UPDATE title = ?`;
        const values = [status_code, lng_id, title, title];
        const [rows] = await db.query(query, values);
        return rows;
    } catch (error) {
        throw error;
    }
}

export const getTemplates = async (id, args) => {
    try {

    } catch (error) {
        throw error;
    }
}
=======
import { CreateError } from '../middleware/createError.js';

export const enqueueBulkMessages = async ({template_id,userId,messages}) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [templates] = await connection.query(`SELECT *FROM md_message_templates WHERE id = ?`,[template_id]);
    if (templates.length === 0) {
      throw CreateError(404,'Template not found');
    }

    const template = templates[0];

    // Extract template variables
    const matches = template.body.match(/{{(.*?)}}/g) || [];

    const requiredVars = [...new Set(matches.map(v => v.replace(/[{}]/g, '').trim()))];
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
        FROM td_prospects
        WHERE id = ?
        AND isActive = TRUE
        `,
        [item.prospect_id]
      );

      if (prospects.length === 0) {
        throw CreateError(404,`Prospect not found: ${item.prospect_id}`);
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
      const finalPayload = {...prospectData,...(item.payload || {})};

      // Validate template variables
      for (const variable of requiredVars) {
        if (!(variable in finalPayload)) {
          throw CreateError(400,`Missing variable: ${variable} for prospect ${item.prospect_id}`);
        }
      }

      // Determine recipient
      let toAddress = null;
      if (template.channel === 'EMAIL') {
        toAddress = prospect.email;
      }

      if (
        template.channel === 'SMS' ||
        template.channel === 'WHATSAPP'
      ) {
        toAddress = prospect.phone;
      }

      if (!toAddress) {
        throw CreateError(400,`Recipient not found for prospect ${item.prospect_id}`);
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
          status,
          created_by
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
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

export const enqueueMessage = async ({template_id,prospect_id,payload = {},userId}) => {
  let connection;
  try {

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Fetch template + prospect using JOIN
    const [rows] = await connection.query(`SELECT
        t.id AS template_id,
        t.channel,
        t.body,
        p.id AS prospect_id,
        p.contact_name,
        p.company_name,
        p.email,
        p.phone
      FROM md_message_templates t INNER JOIN td_prospects p ON p.id = ?
      WHERE t.id = ?
      AND p.isActive = TRUE
      `,[prospect_id, template_id]);

    if (rows.length === 0) {
      throw CreateError(404,'Template or Prospect not found');
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
    const finalPayload = {...prospectData,...payload};

    // Validate template variables
    for (let variable of requiredVars) {

      if (!(variable in finalPayload)) {
        throw CreateError(400,`Missing variable: ${variable}`);
      }
    }

    // Determine recipient automatically
    let toAddress = null;

    if (data.channel === 'EMAIL') {
      toAddress = data.email;
    }

    if (
      data.channel === 'SMS' ||
      data.channel === 'WHATSAPP'
    ) {
      toAddress = data.phone;
    }

    if (!toAddress) {
      throw CreateError(400,'Recipient address not found');
    }

    // Insert message into queue
    const [result] = await connection.query(`
      INSERT INTO td_messages_queue (
        prospect_id,
        channel,
        template_id,
        to_address,
        payload,
        created_by,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
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
/* 
{
  "template_id": 2,
  "prospect_id": 101,
  "userId": 10,
  "payload": {
    "meeting_date": "2026-05-02",
    "meeting_link": "https://meet.google.com/abc"
  }
}
*/

export const queue = async ({status,channel,prospect_id,limit,offset}) => {
  let baseQuery = `FROM td_messages_queue WHERE 1=1`;
  let values = [];
  // Status filter
  if (status && status.length > 0) {
    baseQuery += ` AND status IN (${status.map(() => '?').join(',')})`;
    values.push(...status);
  }

  // Channel filter
  if (channel && channel.length > 0) {
    baseQuery += ` AND channel IN (${channel.map(() => '?').join(',')})`;
    values.push(...channel);
  }

  // prospect_id filter
  if (prospect_id && prospect_id.length > 0 ) {
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

  return {rows};
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

export const updateTemplates = async (id, data) => {
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
/* 
API for update template:
id is passed as path params( id ->> Primary key of template table)
{
  "subject": "Updated Order Confirmation",
  "body": "Hello {{name}}, your order {{order_id}} confirmed."
}
  */

export const getTemplates = async ({ templateCode, channel, language_id, limit, offset }) => {
  try{
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
    templates: rows}
  }
  catch(err){
    throw err;
  }
};
>>>>>>> ede91edf38654010e810be767e3986878c0c126a
