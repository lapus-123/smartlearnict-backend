const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "⚠️  RESEND_API_KEY not set — forgot password emails will fail.",
  );
} else {
  console.log("✅ Mailer ready via Resend");
}

exports.sendPasswordEmail = async ({ to, username, password }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service is not configured on the server.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "SmartLearningICT <onboarding@resend.dev>",
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
  });

  if (error) {
    console.error("❌ Resend error:", JSON.stringify(error));
    throw new Error(error.message || "Failed to send email via Resend");
  }
  console.log("✅ Email sent successfully to:", to, "| ID:", data?.id);
};
