require('dotenv').config();
const express = require('express');
const config = require('./config');
const logger = require('./db/logger');
const messageRoutes = require('./routes/messageRoutes');

require('./cron/deadlockRescue');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/messages', messageRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(config.server.port, () => {
  logger.info(` Server running on port ${config.server.port}`);
});

module.exports = app;