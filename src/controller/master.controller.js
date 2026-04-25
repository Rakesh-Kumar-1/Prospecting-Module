import * as masterService from '../service/master.service.js';

export const getStages = async (req, res, next) => {
  try {
    const { lang } = req.query;
    const data = await masterService.getStages(lang);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getSources = async (req, res, next) => {
  try {
    const data = await masterService.getSources();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getLanguages = async (req, res, next) => {
  try {
    const data = await masterService.getLanguages();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
