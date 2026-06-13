// plugins/botcontrol.js
// .bot - show bot status to anyone
// Auto sends owner a message when bot connects (handled in index.js)

const { loadSettings } = require("../lib/settings");

const commands = {
  // ─── .bot — Anyone can check bot status ──────────────
  async bot({ sock, jid, sender }) {
    const s = loadSettings();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);

    await sock.sendMessage(jid, {
      text: `
╔════════════════════════╗
║   ⚡  *NEXUS-XD BOT*   ║
╚════════════════════════╝

🟢 *Status:* Online
⏱️ *Uptime:* ${h}h ${m}m ${sec}s
🤖 *Bot Name:* ${s.botName}
👑 *Owner:* ${s.ownerName}
📞 *Contact:* wa.me/${s.ownerNumber}
🔤 *Prefix:* ${s.prefix}
🌐 *Mode:* ${s.botMode.toUpperCase()}

_Type *${s.prefix}menu* for all commands_
      `.trim(),
    });
  },

  // ─── .alive — Same as .bot ───────────────────────────
  async alive({ sock, jid }) {
    const s = loadSettings();
    await sock.sendMessage(jid, {
      text: `⚡ *NEXUS-XD* is *ALIVE!* 🟢\n\n_Type ${s.prefix}menu for commands_`,
    });
  },
};

// ─── Send owner notification on bot connect ──────────────
async function notifyOwner(sock) {
  const s = loadSettings();
  const ownerJid = s.ownerNumber + "@s.whatsapp.net";

  try {
    await sock.sendMessage(ownerJid, {
      text: `
╔════════════════════════╗
║  ⚡  *NEXUS-XD ONLINE*  ║
╚════════════════════════╝

✅ Bot connected successfully!
👑 Owner: ${s.ownerName}
🕐 Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })}

*Commands:*
• Any chat ලා type කරන්න: \`${s.prefix}bot\` - bot status
• \`${s.prefix}menu\` - all commands
• \`${s.prefix}settings\` - settings panel

_NEXUS-XD is ready! 🚀_
      `.trim(),
    });
  } catch (e) {
    console.log("Owner notify error:", e.message);
  }
}

module.exports = { commands, notifyOwner };
