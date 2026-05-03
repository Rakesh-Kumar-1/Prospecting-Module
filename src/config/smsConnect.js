import twilio from 'twilio'; // Use import to match your other files
const accountSid = 'AC4477b74ba830bed7193ec072ba94632e';
const authToken = '0f94e4f2806ce349e608e46b8eba2707';
const client = twilio(accountSid, authToken);

export async function sms({ body, to_address }) {
  try{
    const message = await client.messages.create({
      body: body,
      to: `+91${to_address}`, // Text your number
      from: '+12524613373', // From a valid Twilio number
    });
  return message;
  }catch(err){
    throw err;
  }

}
