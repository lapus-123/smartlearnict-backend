const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    "⚠️  EMAIL_USER or EMAIL_PASS not set — forgot password emails will fail.",
  );
}

// Use port 587 with TLS instead of 465 (SSL) — Railway blocks 465
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS, not SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

transporter.verify((err) => {
  if (err) console.error("❌ Mailer config error:", err.message);
  else console.log("✅ Mailer ready on port 587");
});

exports.sendPasswordEmail = async ({ to, username, password }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email service is not configured on the server.");
  }

  const sendWithTimeout = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Email send timeout")),
      25000,
    );
    transporter.sendMail(
      {
        from: `"SmartLearningICT" <${process.env.EMAIL_USER}>`,
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
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(info);
      },
    );
  });

  await sendWithTimeout;
};
