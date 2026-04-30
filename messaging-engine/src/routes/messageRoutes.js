const express = require('express');
const router = express.Router();
const {
  sendSingle,
  sendBulk,
  sendBulkToProspects,
  getQueue
} = require('../controllers/messageController');

router.post('/send-single', sendSingle);
router.post('/send-bulk', sendBulk);
router.post('/send-bulk-prospects', sendBulkToProspects);
router.get('/queue', getQueue);

module.exports = router;