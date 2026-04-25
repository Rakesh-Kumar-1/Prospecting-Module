import db from '../../config/connectionDb.js';

export const sendBulkMessages = async ({templateCode,channel,prospectIds,overrideVars = {},scheduledAt,userId}) =>{
    try{
        const { rows: prospects } = await db.query(
        `SELECT id, email, phone, preferred_lang_id, contact_name, company_name FROM prospects WHERE id = ANY($1)`,[prospectIds]);
        if (!prospects.length) {
        return { queued: 0, skipped: prospectIds.length };
        }

  // 🔹 2. Fetch templates (multi-language)
  const { rows: templates } = await db.query(
    `SELECT id, language_id, subject, body
     FROM message_templates
     WHERE template_code = $1
       AND channel = $2
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
    const toAddress =
      channel === 'EMAIL' ? p.email : p.phone;

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
    const payload = {
      subject,
      body
    };

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

}catch(error){
    throw error;
}
}
export const sendSingle = async () => {
    try{
        const query = `INSERT INTO mt_mkt_budget_status (status_code, lng_id, title) VALUES ($1, $2, $3) RETURNING *`;
        const values = [status_code, lng_id, title];
        const rows  = await client.query(query, values);
        return rows;
    }catch(error){
        throw error;
    }
}
export const queue = async (id, args) => {
    try{

    }catch(error){
        throw error;
    }
}
export const postTemplates = async (status_code, lng_id) =>{
    try{
        const query = `SELECT * FROM mt_mkt_budget_status WHERE status_code = $1 AND lng_id = $2`;
        const values = [status_code, lng_id];
        const rows  = await client.query(query, values);
        return rows;
    }catch(error){
        throw error;
    }
}
export const updateTemplates = async () => {
    try{
        const query = `INSERT INTO mt_mkt_budget_status (status_code, lng_id, title) VALUES ($1, $2, $3) RETURNING *`;
        const values = [status_code, lng_id, title];
        const rows  = await client.query(query, values);
        return rows;
    }catch(error){
        throw error;
    }
}
export const getTemplates = async (id, args) => {
    try{

    }catch(error){
        throw error;
    }
}