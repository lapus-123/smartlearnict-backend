const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail: use App Password, not account password
  },
});

exports.sendPasswordEmail = async ({ to, username, password }) => {
  await transporter.sendMail({
    from: `"SmartLearningICT" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'SmartLearningICT Account Password',
    text: `Hello,

You requested your SmartLearningICT account password.

Your Login Credentials:

  Username : ${username}
  Password : ${password}

Please keep your credentials secure.

If you did not request this email, please ignore it.

— SmartLearningICT Team`,
  });
};
