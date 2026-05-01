import pool from "../../config/db.js";

const createTableQuery = `
CREATE TABLE IF NOT EXISTS message_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  queue_id BIGINT NOT NULL,
  channel ENUM('EMAIL', 'SMS', 'WHATSAPP') NOT NULL,

  to_address VARCHAR(500) NOT NULL,
  provider VARCHAR(100), -- sendgrid, twilio
  provider_msg_id VARCHAR(255),

   status ENUM('SUCCESS','FAILED') NOT NULL,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP NULL,
  attempt_number INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_queue FOREIGN KEY (queue_id)
    REFERENCES td_messages_queue(id)
    ON DELETE CASCADE
);
`;

export async function createTable() {
  try {
    await pool.query(createTableQuery);
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table', err);
  }
}