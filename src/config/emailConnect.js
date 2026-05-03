import nodemailer from "nodemailer"
// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER || 'brandy.singh0001@gmail.com',
    pass: process.env.SMTP_PASS || 'wdwxzxgovgbgejoq',
  },
});

export default transporter;