const db = require('../db/connection');
const logger = require('../db/logger');

const resolveTemplate = async (
  templateCode, channel, langId = 'EN', vars = {}
) => {
  // Try requested language first
  let [rows] = await db.query(
    `SELECT id, subject, body 
     FROM md_message_templates
     WHERE template_code = ? 
     AND channel = ? 
     AND language_id = ? 
     AND is_active = 1
     LIMIT 1`,
    [templateCode, channel, langId]
  );

  let template = rows[0] || null;
  let langUsed = langId;

  // Fallback to English if not found
  if (!template && langId !== 'EN') {
    logger.warn(
      `Template '${templateCode}' not found for lang 
      '${langId}', falling back to EN`
    );
    [rows] = await db.query(
      `SELECT id, subject, body 
       FROM md_message_templates
       WHERE template_code = ? 
       AND channel = ? 
       AND language_id = 'EN' 
       AND is_active = 1
       LIMIT 1`,
      [templateCode, channel]
    );
    template = rows[0] || null;
    langUsed = 'EN';
  }

  if (!template) {
    throw new Error(
      `TEMPLATE_NOT_FOUND: ${templateCode} | ${channel} | ${langId}`
    );
  }

  // Replace all {{variables}} with real values
  let body = template.body;
  let subject = template.subject || '';

  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    body = body.replace(regex, value || '');
    subject = subject.replace(regex, value || '');
  });

  return { templateId: template.id, body, subject, langUsed };
};

module.exports = { resolveTemplate };