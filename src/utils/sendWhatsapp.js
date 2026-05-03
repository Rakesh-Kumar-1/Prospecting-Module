import { whatsapp } from "../config/whatsappConnect.js";

export const sendWhatsapp = async({body,to_address}) => {
    try{
        const result = await whatsapp({ body, to_address });
            return {
        provider: 'TWILIO WHATSAPP',
        messageId: result.sid
    };
    } catch (err){
        throw err;
    }
}