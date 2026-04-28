import db from '../config/db.js';
import { CreateError } from '../middleware/createError.js';

export const enqueueBulk = async ({template_id, scheduled_at, messages,userId }) => {
  try{
  // 🔹 1. Fetch template once
  const [templates] = await db.query(
    `SELECT * FROM md_message_templates 
     WHERE id = ?`,
    [template_id]
  );

  if (templates.length === 0) {
    throw CreateError(404, "Template not found");
  }

  const template = templates[0];

  // 🔹 2. Extract variables once
  const matches = template.body.match(/{{(.*?)}}/g) || [];
  const requiredVars = [...new Set(
    matches.map(v => v.replace(/[{}]/g, '').trim())
  )];

  // 🔹 3. Prepare bulk insert
  const values = [];

  for (let msg of messages) {

    const { to, payload, prospect_id } = msg;

    if (!to || !payload || !prospect_id) {
      throw CreateError(400, "Each message must have 'to', 'payload', and 'prospect_id'");
    }

    // 🔹 Validate payload
    for (let v of requiredVars) {
      if (!(v in payload)) {
        throw CreateError(400, `Missing variable: ${v}`);
      }
    }

    values.push([
      template.channel,
      template.id,
      prospect_id,
      to,
      JSON.stringify(payload),
      'PENDING',
      scheduled_at || null
    ]);
  }

  // 🔹 4. Bulk insert
  const query = `
    INSERT INTO td_messages_queue 
    (channel, template_id, prospect_id, to_address, payload, status, scheduled_at)
    VALUES ?
  `;
  console.table(values);
  const [result] = await db.query(query, [values]);
  return { result};
} catch (error) {
  throw error;}
};
/* 
{
  "templateCode": "ORDER_CONFIRMATION",
  "channel": "EMAIL",
  "language_id": "en",
  "scheduled_at": "2026-04-27T12:00:00Z",
  "messages": [
    {
      "prospect_id": 101,
      "to": "user1@example.com",
      "payload": { "name": "Rakesh", "order_id": "ORD1" }
    },
    {
      "prospect_id": 102,
      "to": "user2@example.com",
      "payload": { "name": "Amit", "order_id": "ORD2" }
    }
  ]
}
*/
export const enqueueMessage = async ({ template_id, to, payload, scheduled_at, prospect_id,userId }) => {
  try {
    // 🔹 1. Fetch template
    const [templates] = await db.query(
      `SELECT * FROM md_message_templates 
     WHERE id = ?`,
      [template_id]
    );
    if (templates.length === 0) {
      throw CreateError(404, "Template not found ");
    }

    const template = templates[0];
    console.log(template);
    // 🔹 2. Extract variables from template body
    const matches = template.body.match(/{{(.*?)}}/g) || [];

    const requiredVars = [...new Set(
      matches.map(v => v.replace(/[{}]/g, '').trim())
    )];
    console.log(requiredVars);
    // 🔹 3. Validate payload
    for (let v of requiredVars) {
      if (!(v in payload)) {
        throw CreateError(400, `Missing variable: ${v}`);
      }
    }

    // 🔹 4. Insert into queue
    const query = ` INSERT INTO td_messages_queue (
      channel,
      template_id,
      to_address,
      payload,
      prospect_id,
      scheduled_at,
      created_by,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?,'PENDING') `;

    const values = [
      template.channel,
      template.id,
      to,
      JSON.stringify(payload),
      prospect_id,
      scheduled_at || null,
      userId 
    ];
    console.table(values);
    const [result] = await db.query(query, values);
    return {result};
  } catch (error) {
    throw error;
  }
};
/* 
{
  "template_id": 39,
  "to": "user@example.com",
  "prospect_id": 101,
  "payload": {
    "name": "Rakesh",
    "order_id": "ORD123"
  },
  "scheduled_at": "2026-04-27T12:00:00Z",
  "userId": 101
}
*/
export const queue = async ({status,channel,prospect_id,limit,offset}) => {
  let baseQuery = `FROM td_messages_queue WHERE 1=1`;
  let values = [];

  // 🔹 Status filter
  if (status && status.length > 0) {
    baseQuery += ` AND status IN (${status.map(() => '?').join(',')})`;
    values.push(...status);
  }

  // 🔹 Channel filter
  if (channel && channel.length > 0) {
    baseQuery += ` AND channel IN (${channel.map(() => '?').join(',')})`;
    values.push(...channel);
  }

  // 🔹 prospect_id filter
  if (prospect_id && prospect_id.length > 0 ) {
    baseQuery += ` AND prospect_id IN (${prospect_id.map(() => '?').join(',')})`;
    values.push(...prospect_id);
  }

  // 🔹 Count query
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const [[countResult]] = await db.query(countQuery, values);

  // 🔹 Data query
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

  // 🔹 Filters
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

  // 🔹 Total count query
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const [[countResult]] = await db.query(countQuery, values);

  // 🔹 Data query with pagination
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
