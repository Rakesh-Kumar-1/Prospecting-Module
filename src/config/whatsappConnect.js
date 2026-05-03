import twilio from 'twilio'; // Use import to match your other files
const accountSid = 'AC4477b74ba830bed7193ec072ba94632e';
const authToken = '0f94e4f2806ce349e608e46b8eba2707';
const client = twilio(accountSid, authToken);

export async function whatsapp({to_address,body}) {
  try{
    const message = await client.messages.create({
      contentSid: 'HX229f5a04fd0510ce1b071852155d3e75',
      contentVariables: '{"1":"409173"}',
      body: body,
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${to_address}`,
    });
    return message;
  }
  catch(err){
    throw err;
  }
}