import twilio from 'twilio';
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const whatsappNumber = process.env.WHATSAPP;
const client = twilio(accountSid, authToken);

export async function whatsapp({to_address,body}) {
  try{
    const message = await client.messages.create({
      contentSid: process.env.CONTENT_SID,
      // contentVariables: '{"1":"409173"}',
      body: body,
      from: whatsappNumber,
      to: `whatsapp:+91${to_address}`,
    });
    return message;
  }
  catch(err){
    throw err;
  }
}