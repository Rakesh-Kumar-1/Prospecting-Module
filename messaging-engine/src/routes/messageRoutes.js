const express = require('express');
const router = express.Router();
const { sendSingle, sendBulk, getQueue } = require('../controllers/messageController');

router.post('/send-single', sendSingle);
router.post('/send-bulk',   sendBulk);
router.get('/queue',        getQueue);

module.exports = router;