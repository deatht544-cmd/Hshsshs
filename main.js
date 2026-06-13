const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { loadSettings, updateSetting } = require("./lib/settings");

// ─── Load Plugins ─────────────────────────────────────
const plugins = {};
const pluginDir = path.join(__dirname, "plugins");
if (fs.existsSync(pluginDir)) {
  fs.readdirSync(pluginDir).filter(f => f.endsWith(".js")).forEach(file => {
    try {
      plugins[file.replace(".js", "")] = require(`./plugins/${file}`);
      console.log(chalk.green(`✅ Plugin: ${file}`));
    } catch (e) {
      console.log(chalk.red(`❌ Plugin error [${file}]: ${e.message}`));
    }
  });
}

// ─── Helpers ──────────────────────────────────────────
function getText(msg) {
  const m = msg.message;
  if (!m) return "";
  return m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption || "";
}

function getType(msg) {
  if (!msg.message) return null;
  return Object.keys(msg.message).filter(k =>
    k !== "messageContextInfo" && k !== "senderKeyDistributionMessage"
  )[0] || null;
}

function isOwner(jid) {
  const s = loadSettings();
  return jid.replace(/[^0-9]/g, "") === s.ownerNumber;
}

// ─── Main Handler ─────────────────────────────────────
async function handleMessage(sock, msg, msgStore) {
  const s = loadSettings();
  const jid = msg.key.remoteJid;
  if (!jid) return;

  const isGroup = jid.endsWith("@g.us");
  const sender = isGroup ? (msg.key.participant || "") : jid;
  const type = getType(msg);
  const body = getText(msg);
  const prefix = s.prefix;
  const isCmd = body.startsWith(prefix);
  const cmd = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
  const args = isCmd ? body.slice(prefix.length).trim().split(" ").slice(1) : [];
  const ownerSender = isOwner(sender);

  // ─── Status Broadcast ─────────────────────────────
  if (jid === "status@broadcast") {
    if (s.autoStatusSeen) await sock.readMessages([msg.key]).catch(() => {});
    if (s.autoStatusReact) {
      await sock.sendMessage(jid, {
        react: { text: s.statusReactEmoji, key: msg.key }
      }).catch(() => {});
    }
    if (s.autoStatusSave) await saveStatus(msg, sender, type);
    return;
  }

  // ─── Anti Delete ──────────────────────────────────
  if (type === "protocolMessage" && s.antiDelete) {
    const proto = msg.message?.protocolMessage;
    if (proto?.type === 0) {
      const delId = proto.key?.id;
      const delJid = proto.key?.remoteJid || jid;
      const saved = msgStore[delJid]?.[delId] || msgStore[jid]?.[delId];
      if (saved) {
        const delText = getText(saved);
        const delSender = saved.key?.participant || saved.key?.remoteJid || sender;
        if (delText) {
          await sock.sendMessage(jid, {
            text: `🚨 *NEXUS-XD | Anti-Delete*\n\n👤 *From:* @${delSender.split("@")[0]}\n💬 *Message:* ${delText}`,
            mentions: [delSender]
          }).catch(() => {});
        } else {
          // Try forward media
          await sock.sendMessage(jid, {
            text: `🚨 *NEXUS-XD | Anti-Delete*\n\n👤 *From:* @${delSender.split("@")[0]}\n📎 *(Media message deleted)*`,
            mentions: [delSender]
          }).catch(() => {});
        }
      }
    }
    return;
  }

  // ─── Anti View Once ───────────────────────────────
  if (s.antiViewOnce) {
    const voMsg = msg.message?.viewOnceMessage?.message ||
                  msg.message?.viewOnceMessageV2?.message;
    if (voMsg) {
      const voType = Object.keys(voMsg)[0];
      try {
        const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
        const mediaType = voType === "imageMessage" ? "image" : "video";
        const stream = await downloadContentFromMessage(voMsg[voType], mediaType);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        await sock.sendMessage(jid, {
          [mediaType]: buf,
          caption: `🔓 *NEXUS-XD | View Once Revealed*`
        }).catch(() => {});
      } catch {}
      return;
    }
  }

  // ─── Anti Call ────────────────────────────────────
  if (type === "callLogMessage" && s.antiCall) {
    await sock.sendMessage(jid, {
      text: `📵 *NEXUS-XD | Anti-Call*\n\nCalls are disabled!\nContact: wa.me/${s.ownerNumber}`
    }).catch(() => {});
    return;
  }

  // ─── Presence ─────────────────────────────────────
  if (s.alwaysOnline) await sock.sendPresenceUpdate("available", jid).catch(() => {});

  // ─── Commands only ────────────────────────────────
  if (!isCmd) return;
  if (s.botMode === "private" && !ownerSender) return;

  console.log(chalk.cyan(`CMD: ${prefix}${cmd} | ${sender.split("@")[0]}`));

  const ctx = { sock, msg, jid, sender, isGroup, ownerSender, args, text: args.join(" "), settings: s, cmd, prefix, msgStore };

  // Built-in commands
  if (["menu", "help", "start"].includes(cmd)) return sendMenu(sock, jid, s);
  if (cmd === "settings") return sendSettingsMenu(sock, jid, s);

  // Plugin commands
  for (const plugin of Object.values(plugins)) {
    if (plugin.commands?.[cmd]) {
      try { await plugin.commands[cmd](ctx); } catch (e) {
        await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }).catch(() => {});
      }
      return;
    }
  }

  await sock.sendMessage(jid, {
    text: `❓ Unknown: *${prefix}${cmd}*\nType *${prefix}menu* for commands.`
  }).catch(() => {});
}

// ─── Save Status ──────────────────────────────────────
async function saveStatus(msg, sender, type) {
  try {
    const dir = "./downloads/status";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const { downloadMediaMessage } = require("@whiskeysockets/baileys");
    const buf = await downloadMediaMessage(msg, "buffer", {});
    const ext = type?.includes("image") ? "jpg" : type?.includes("video") ? "mp4" : "bin";
    fs.writeFileSync(`${dir}/${Date.now()}_${sender.split("@")[0]}.${ext}`, buf);
  } catch {}
}

// ─── Main Menu ────────────────────────────────────────
async function sendMenu(sock, jid, s) {
  await sock.sendMessage(jid, { text: `
╔═══════════════════════╗
║  ${s.menuEmoji}  *NEXUS-XD BOT*  ${s.menuEmoji}  ║
╚═══════════════════════╝

👑 *Owner:* ${s.ownerName}
📞 *Contact:* wa.me/${s.ownerNumber}
🤖 *Mode:* ${s.botMode.toUpperCase()}
🔤 *Prefix:* \`${s.prefix}\`

━━━━━━━━━━━━━━━━━━━━━
🛡️ *PROTECTION*
━━━━━━━━━━━━━━━━━━━━━
• \`${s.prefix}antidelete\` ${s.antiDelete?"✅":"❌"}
• \`${s.prefix}anticall\` ${s.antiCall?"✅":"❌"}
• \`${s.prefix}antiviewonce\` ${s.antiViewOnce?"✅":"❌"}

━━━━━━━━━━━━━━━━━━━━━
📊 *STATUS*
━━━━━━━━━━━━━━━━━━━━━
• \`${s.prefix}statussave\` ${s.autoStatusSave?"✅":"❌"}
• \`${s.prefix}statusseen\` ${s.autoStatusSeen?"✅":"❌"}
• \`${s.prefix}statusreact\` ${s.autoStatusReact?"✅":"❌"}
• \`${s.prefix}statusauto on/off\`

━━━━━━━━━━━━━━━━━━━━━
👥 *GROUP*
━━━━━━━━━━━━━━━━━━━━━
• \`${s.prefix}groupinfo\`
• \`${s.prefix}kick @user\`
• \`${s.prefix}add 94xxx\`
• \`${s.prefix}promote @user\`
• \`${s.prefix}demote @user\`
• \`${s.prefix}tagall\`

━━━━━━━━━━━━━━━━━━━━━
🔧 *TOOLS*
━━━━━━━━━━━━━━━━━━━━━
• \`${s.prefix}getdp @user\`
• \`${s.prefix}save\` (reply media)
• \`${s.prefix}viewonce\` (reply vo)
• \`${s.prefix}userinfo @user\`
• \`${s.prefix}sticker\` (reply img)
• \`${s.prefix}ping\`
• \`${s.prefix}bot\`

━━━━━━━━━━━━━━━━━━━━━
⚙️ *SETTINGS*
━━━━━━━━━━━━━━━━━━━━━
• \`${s.prefix}settings\`
• \`${s.prefix}online\` / \`${s.prefix}offline\`
• \`${s.prefix}setemoji 🔥\`
• \`${s.prefix}setprefix .\`
• \`${s.prefix}mode public/private\`

© NEXUS-XD | Vishath Kawshika`.trim() });
}

// ─── Settings Menu ────────────────────────────────────
async function sendSettingsMenu(sock, jid, s) {
  const o = "✅ ON", x = "❌ OFF";
  await sock.sendMessage(jid, { text: `
╔═══════════════════════╗
║  ⚙️  *NEXUS-XD SETTINGS* ║
╚═══════════════════════╝

🛡️ *PROTECTION*
├ Anti Delete : ${s.antiDelete?o:x}
├ Anti Call   : ${s.antiCall?o:x}
└ Anti ViewOnce: ${s.antiViewOnce?o:x}

📊 *STATUS*
├ Auto Save   : ${s.autoStatusSave?o:x}
├ Auto Seen   : ${s.autoStatusSeen?o:x}
└ Auto React  : ${s.autoStatusReact?o:x} ${s.statusReactEmoji}

🌐 *PRESENCE*
├ Always Online : ${s.alwaysOnline?o:x}
└ Always Offline: ${s.alwaysOffline?o:x}

🤖 *BOT*
├ Mode   : ${s.botMode.toUpperCase()}
├ Prefix : ${s.prefix}
└ Emoji  : ${s.menuEmoji}

📒 Auto Save Contact: ${s.autoSaveContact?o:x}

━━━━━━━━━━━━━━━━━━━━━
*Toggle Commands:*
\`.antidelete\` \`.anticall\` \`.antiviewonce\`
\`.statussave\` \`.statusseen\` \`.statusreact\`
\`.online\` \`.offline\` \`.normalmode\`
\`.setemoji 🔥\` \`.setprefix !\`
\`.mode public/private\``.trim() });
}

module.exports = { handleMessage };
