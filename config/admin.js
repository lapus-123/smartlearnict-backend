// ─── HARDCODED ADMIN CREDENTIALS ─────────────────────────────────────────────
// Change these values here directly. This file should NOT be committed to VCS.
// Add config/admin.js to your .gitignore.
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "Admin@1234",
  fullName: process.env.ADMIN_FULLNAME || "System Administrator",
  role: "admin",
};
