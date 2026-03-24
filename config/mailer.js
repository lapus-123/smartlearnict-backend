const nodemailer = require("nodemailer");

if (!process.env.BREVO_USER || !process.env.BREVO_PASS) {
  console.warn("⚠️  BREVO_USER or BREVO_PASS not set — emails will fail.");
} else {
  console.log("✅ Mailer ready via Brevo SMTP");
}

exports.sendPasswordEmail = async ({ to, username, password }) => {
  if (!process.env.BREVO_USER || !process.env.BREVO_PASS) {
    throw new Error("Email service is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
  });

  const { error } = await new Promise((resolve) => {
    transporter.sendMail(
      {
        from: `"SmartLearningICT" <${process.env.BREVO_USER}>`,
        to,
        subject: "SmartLearningICT Account Password",
        text: `Hello,

You requested your SmartLearningICT account password.

Your Login Credentials:

  Username : ${username}
  Password : ${password}

Please keep your credentials secure.

If you did not request this email, please ignore it.

— SmartLearningICT Team`,
      },
      (err, info) => {
        if (err) {
          console.error("❌ Brevo error:", err.message);
          resolve({ error: err });
        } else {
          console.log("✅ Email sent to:", to);
          resolve({ info });
        }
      },
    );
  });

  if (error) throw new Error(error.message);
};
