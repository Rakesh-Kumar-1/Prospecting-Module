import db from "../../config/db.js";

const createTableQuery = `
  CREATE INDEX idx_message_logs_queue ON td_messages_logs(queue_id)
    
  CREATE INDEX idx_message_queue_status ON td_messages_queue(status)
    
  CREATE INDEX idx_message_queue_scheduled ON td_messages_queue(scheduled_at)
    
  CREATE INDEX idx_message_queue_prospect ON td_messages_queue(prospect_id)
`;

export async function createTable() {
  try {
    await db.execute(createTableQuery);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table', err);
  }
};


