// Uses Brevo HTTP API instead of SMTP — bypasses Railway port blocking
const axios = require("axios");

if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️  BREVO_API_KEY not set — emails will fail.");
} else {
  console.log("✅ Mailer ready via Brevo HTTP API");
}

exports.sendPasswordEmail = async ({ to, username, password }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("Email service is not configured.");
  }

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "SmartLearningICT",
        email: process.env.BREVO_SENDER || process.env.BREVO_USER,
      },
      to: [{ email: to }],
      subject: "SmartLearningICT Account Password",
      textContent: `Hello,

You requested your SmartLearningICT account password.

Your Login Credentials:

  Username : ${username}
  Password : ${password}

Please keep your credentials secure.

If you did not request this email, please ignore it.

— SmartLearningICT Team`,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
  );

  console.log(
    "✅ Email sent to:",
    to,
    "| MessageId:",
    response.data?.messageId,
  );
};
