const express = require('express');
const router = express.Router();
const {
  sendSingle,
  sendBulk,
  sendBulkToProspects,
  getQueue
} = require('../controllers/messageController');

// Single message
router.post('/send-single', sendSingle);

// Bulk messages (direct)
router.post('/send-bulk', sendBulk);

// Bulk messages to prospects (uses prospects table)
router.post('/send-bulk-prospects', sendBulkToProspects);

// Queue stats
router.get('/queue', getQueue);

module.exports = router;