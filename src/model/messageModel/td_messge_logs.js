import pool from "../../config/db.js";

const createTableQuery = `
CREATE TABLE IF NOT EXISTS td_message_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  queue_id BIGINT NOT NULL,
  channel ENUM('EMAIL','SMS','WHATSAPP') NOT NULL,
  status ENUM('SUCCESS','FAILED') NOT NULL,
  provider VARCHAR(100),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_queue_id (queue_id),
  INDEX idx_status (status)
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
