import * as messageService from '../service/messagesService.js';
import { CreateError } from '../middleware/createError.js';

export const sendBulk = async (req, res, next) => {
  try {
    console.log('REQUEST BODY:', req.body);
    const { templateCode, channel, prospectIds, overrideVars, scheduledAt } = req.body;
    if (!templateCode || !channel || !Array.isArray(prospectIds) || prospectIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid request payload' });
    }
    const result = await messageService.sendBulkMessages({
      templateCode, channel, prospectIds,
      overrideVars: overrideVars || {},
      scheduledAt: scheduledAt || null,
      userId: req.body.userId || 1,
    });
    return res.status(200).json({ success: true, queued: result.queued, skipped: result.skipped });
  } catch (error) {
    console.error('SEND BULK ERROR:', error);
    next(CreateError(500, 'Internal Server Error'));
  }
};

export const sendSingle = async (req, res, next) => {
  try {
    const result = await messageService.sendSingle();
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('SEND SINGLE ERROR:', error);
    next(CreateError(500, 'Internal Server Error'));
  }
};

export const queue = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

export const postTemplates = async (req, res, next) => {
  try {
    const { status_code, lng_id, title } = req.body;
    const result = await messageService.postTemplates(status_code, lng_id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

export const updateTemplates = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true });
  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

export const getTemplates = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    next(CreateError(500, 'Internal Server Error'));
  }
};

