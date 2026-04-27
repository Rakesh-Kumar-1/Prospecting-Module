const db = require('../db/connection');
const { resolveTemplate } = require('./templateService');
const logger = require('../db/logger');

const enqueueSingleMessage = async ({
  channel, prospectId, toAddress, templateCode,
  langId = 'EN', vars = {}, scheduledAt = null, createdBy = null,
}) => {
  const resolved = await resolveTemplate(templateCode, channel, langId, vars);

  const payload = {
    body: resolved.body,
    subject: resolved.subject || ''
  };

  const [result] = await db.query(
    `INSERT INTO message_queue
     (channel, prospect_id, template_id, to_address, payload, status, scheduled_at, created_by)
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

  logger.info(`[QUEUE] Enqueued ${channel} to ${toAddress} | QueueID: ${result.insertId}`);
  return result.insertId;
};

const enqueueBulkMessages = async (messages, createdBy = null) => {
  if (!messages || messages.length === 0) return 0;

  const resolved = await Promise.all(
    messages.map(msg =>
      resolveTemplate(msg.templateCode, msg.channel, msg.langId || 'EN', msg.vars || {})
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
    `INSERT INTO message_queue
     (channel, prospect_id, template_id, to_address, payload, status, scheduled_at, created_by)
     VALUES ?`,
    [rows]
  );

  logger.info(`[QUEUE] Bulk enqueued ${result.affectedRows} messages`);
  return result.affectedRows;
};

const getQueueStats = async () => {
  const [rows] = await db.query(
    `SELECT status, COUNT(*) as count FROM message_queue GROUP BY status`
  );
  const stats = { PENDING: 0, PROCESSING: 0, SENT: 0, FAILED: 0, CANCELLED: 0 };
  rows.forEach(row => { stats[row.status] = row.count; });
  return stats;
};

module.exports = { enqueueSingleMessage, enqueueBulkMessages, getQueueStats };