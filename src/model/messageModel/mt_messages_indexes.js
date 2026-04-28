import pool from "../../config/connection.js";

const createTableQuery = `
CREATE INDEX idx_message_logs_queue 
ON message_logs(queue_id);

CREATE INDEX idx_message_queue_status 
ON message_queue(status);

CREATE INDEX idx_message_queue_scheduled 
ON message_queue(scheduled_at);

CREATE INDEX idx_message_queue_prospect 
ON message_queue(prospect_id);

-- Channel Type
CREATE TYPE message_channel AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- Message Status
CREATE TYPE message_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
  'CANCELLED'
);`

export async function createTable() {
  try {
    await pool.query(createTableQuery);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table', err);
  }
};


