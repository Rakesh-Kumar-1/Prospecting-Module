import * as messageService from '../src/service/messagesService.js';
import {CreateError}  from '../middleware/createError.js';

export const sendBulk = async (req,res,next) => {
    try{
        const {templateCode,channel,prospectIds,overrideVars,scheduledAt} = req.body;
        if (!templateCode || !channel || !Array.isArray(prospectIds) || prospectIds.length === 0) {
            return next(CreateError(400,'Invalid request payload'))
        }
        const result = await messageService.sendBulkMessages({
        templateCode,channel,prospectIds,overrideVars,scheduledAt,userId: req.user.id});
        return res.status(200).json({success: true,queued: result.queued,skipped: result.skipped}); 
    }catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}

/*
{
  "templateCode": "FOLLOWUP_1",
  "channel": "EMAIL",
  "prospectIds": [101, 102, 103],
  "overrideVars": {
    "agent_name": "Rakesh",
    "response_hours": "24"
  },
  "scheduledAt": null
}
*/
export const sendSingle = async (req,res,next) => {
    try{}
    catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}

export const queue = async (req,res,next) => {
    try{}
    catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}

export const postTemplates = async (req,res,next) => {
    try{}
    catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}

export const updateTemplates = async (req,res,next) => {
    try{}
    catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}

export const getTemplates = async (req,res,next) => {
    try{}
    catch(error){
        next(CreateError(500, 'Internal Server Error'));
    }
}