const db = require('../db/connection');
const { resolveTemplate } = require('./templateService');
const logger = require('../db/logger');

// Send single message
const enqueueSingleMessage = async ({
  channel,
  prospectId,
  toAddress,
  templateCode,
  langId = 'EN',
  vars = {},
  scheduledAt = null,
  createdBy = null,
}) => {
  const resolved = await resolveTemplate(
    templateCode, channel, langId, vars
  );

  const payload = {
    body: resolved.body,
    subject: resolved.subject || ''
  };

  const [result] = await db.query(
    `INSERT INTO td_message_queue
     (channel, prospect_id, template_id, to_address, 
      payload, status, scheduled_at, created_by)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [
      channel,
      prospectId || null,
      resolved.templateId,
      toAddress,
      JSON.stringify(payload),
      scheduledAt || null,
      createdBy || null,
    ]
  );

  logger.info(
    `[QUEUE] Enqueued ${channel} to ${toAddress} | QueueID: ${result.insertId}`
  );
  return result.insertId;
};

// Send bulk messages
const enqueueBulkMessages = async (messages, createdBy = null) => {
  if (!messages || messages.length === 0) return 0;

  const resolved = await Promise.all(
    messages.map(msg =>
      resolveTemplate(
        msg.templateCode,
        msg.channel,
        msg.langId || 'EN',
        msg.vars || {}
      )
    )
  );

  const rows = messages.map((msg, i) => [
    msg.channel,
    msg.prospectId || null,
    resolved[i].templateId,
    msg.toAddress,
    JSON.stringify({
      body: resolved[i].body,
      subject: resolved[i].subject || ''
    }),
    'PENDING',
    msg.scheduledAt || null,
    createdBy,
  ]);

  const [result] = await db.query(
    `INSERT INTO td_message_queue
     (channel, prospect_id, template_id, to_address,
      payload, status, scheduled_at, created_by)
     VALUES ?`,
    [rows]
  );

  logger.info(`[QUEUE] Bulk enqueued ${result.affectedRows} messages`);
  return result.affectedRows;
};

// Send bulk messages to prospects directly
const enqueueBulkToProspects = async ({
  templateCode,
  channel,
  prospectIds,
  overrideVars = {},
  scheduledAt,
  userId,
}) => {
  // Get prospect details from prospects table
  const placeholders = prospectIds.map(() => '?').join(',');
  const [prospects] = await db.query(
    `SELECT id, email, phone, preferred_lang_id, 
            contact_name, company_name 
     FROM prospects 
     WHERE id IN (${placeholders})`,
    prospectIds
  );

  if (!prospects.length) {
    return { queued: 0, skipped: prospectIds.length };
  }

  let skipped = 0;
  const rows = [];

  for (const prospect of prospects) {
    const langId = prospect.preferred_lang_id || 'EN';

    // Resolve template for this prospect's language
    let resolved;
    try {
      resolved = await resolveTemplate(
        templateCode, channel, langId, {
          name: prospect.contact_name || '',
          company: prospect.company_name || '',
          ...overrideVars
        }
      );
    } catch (err) {
      skipped++;
      continue;
    }

    // Get correct address based on channel
    const toAddress = channel === 'EMAIL'
      ? prospect.email
      : prospect.phone;

    if (!toAddress) {
      skipped++;
      continue;
    }

    rows.push([
      channel,
      prospect.id,
      resolved.templateId,
      toAddress,
      JSON.stringify({
        body: resolved.body,
        subject: resolved.subject || ''
      }),
      'PENDING',
      scheduledAt || null,
      userId,
    ]);
  }

  if (rows.length > 0) {
    await db.query(
      `INSERT INTO td_message_queue
       (channel, prospect_id, template_id, to_address,
        payload, status, scheduled_at, created_by)
       VALUES ?`,
      [rows]
    );
  }

  logger.info(
    `[QUEUE] Bulk prospect enqueue — queued: ${rows.length} skipped: ${skipped}`
  );
  return { queued: rows.length, skipped };
};

// Get queue statistics
const getQueueStats = async () => {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) as count 
     FROM td_message_queue 
     GROUP BY status`
  );
  const stats = {
    PENDING: 0,
    PROCESSING: 0,
    SENT: 0,
    FAILED: 0,
    CANCELLED: 0
  };
  rows.forEach(row => { stats[row.status] = row.count; });
  return stats;
};

module.exports = {
  enqueueSingleMessage,
  enqueueBulkMessages,
  enqueueBulkToProspects,
  getQueueStats
};