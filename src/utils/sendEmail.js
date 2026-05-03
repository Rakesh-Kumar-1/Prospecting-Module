import transporter from "../config/emailConnect.js";

export const sendEmail = async ({ to,subject,body}) => {
 try{
    const info = await transporter.sendMail({
    to: to, // list of recipients
    subject: subject, // subject line
    text: body, // plain text body
    });
    console.log("Message sent: %s", info.messageId);
    return {success: true,provider: 'EMAIL',messageId: info.messageId};
 } catch(err){
   console.error("Error while sending mail:", err);
   throw err;
 }
};