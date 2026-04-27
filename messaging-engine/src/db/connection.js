const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('./logger');

const pool = mysql.createPool(config.db);

pool.getConnection()
  .then(conn => {
    logger.info(' MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    logger.error(' MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;