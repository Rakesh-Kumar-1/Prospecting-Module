const {
  enqueueSingleMessage,
  enqueueBulkMessages,
  enqueueBulkToProspects,
  getQueueStats
} = require('../services/queueService');
const logger = require('../db/logger');

// POST /api/messages/send-single
const sendSingle = async (req, res) => {
  try {
    const {
      channel,
      prospectId,
      toAddress,
      templateCode,
      langId,
      vars,
      scheduledAt
    } = req.body;

    if (!channel || !toAddress || !templateCode) {
      return res.status(400).json({
        success: false,
        error: 'channel, toAddress and templateCode are required',
      });
    }

    if (!['EMAIL', 'SMS', 'WHATSAPP'].includes(channel)) {
      return res.status(400).json({
        success: false,
        error: 'channel must be EMAIL, SMS or WHATSAPP',
      });
    }

    const queueId = await enqueueSingleMessage({
      channel,
      prospectId,
      toAddress,
      templateCode,
      langId: langId || 'EN',
      vars: vars || {},
      scheduledAt: scheduledAt || null,
      createdBy: req.user?.id || null,
    });

    return res.status(202).json({
      success: true,
      message: 'Message queued successfully',
      queueId,
    });

  } catch (err) {
    logger.error(`[CONTROLLER] sendSingle error: ${err.message}`);
    if (err.message.startsWith('TEMPLATE_NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/messages/send-bulk
const sendBulk = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages must be a non-empty array'
      });
    }

    if (messages.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10,000 messages per bulk request'
      });
    }

    const count = await enqueueBulkMessages(
      messages, req.user?.id || null
    );

    return res.status(202).json({
      success: true,
      message: `${count} messages queued`,
      count,
    });

  } catch (err) {
    logger.error(`[CONTROLLER] sendBulk error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/messages/send-bulk-prospects
const sendBulkToProspects = async (req, res) => {
  try {
    const {
      templateCode,
      channel,
      prospectIds,
      overrideVars,
      scheduledAt
    } = req.body;

    if (!templateCode || !channel || !prospectIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'templateCode, channel and prospectIds are required'
      });
    }

    const result = await enqueueBulkToProspects({
      templateCode,
      channel,
      prospectIds,
      overrideVars: overrideVars || {},
      scheduledAt: scheduledAt || null,
      userId: req.user?.id || null,
    });

    return res.status(202).json({
      success: true,
      message: `${result.queued} messages queued`,
      ...result,
    });

  } catch (err) {
    logger.error(
      `[CONTROLLER] sendBulkToProspects error: ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// GET /api/messages/queue
const getQueue = async (req, res) => {
  try {
    const stats = await getQueueStats();
    return res.status(200).json({ success: true, stats });
  } catch (err) {
    logger.error(`[CONTROLLER] getQueue error: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = { sendSingle, sendBulk, sendBulkToProspects, getQueue };