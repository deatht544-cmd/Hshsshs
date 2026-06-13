const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { getQuotedMessage } = require("../lib/utils");
const fs = require("fs");
const path = require("path");

const commands = {
  // ─── Get DP ──────────────────────────────────────────
  async getdp({ sock, jid, msg, args, sender }) {
    let target;

    // Check mentioned user
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mentioned) {
      target = mentioned;
    } else if (args[0]) {
      target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    } else {
      target = sender;
    }

    try {
      const ppUrl = await sock.profilePictureUrl(target, "image");
      await sock.sendMessage(jid, {
        image: { url: ppUrl },
        caption: `🖼️ *NEXUS-XD | Profile Picture*\n👤 wa.me/${target.replace("@s.whatsapp.net", "")}`,
      });
    } catch {
      await sock.sendMessage(jid, {
        text: `❌ No profile picture found for @${target.replace("@s.whatsapp.net", "")} or it's private.`,
        mentions: [target],
      });
    }
  },

  // ─── Sticker ─────────────────────────────────────────
  async sticker({ sock, jid, msg }) {
    const quoted = getQuotedMessage(msg);
    const targetMsg = quoted || msg;

    const msgType = Object.keys(targetMsg.message || {})[0];
    if (!["imageMessage", "videoMessage"].includes(msgType)) {
      return sock.sendMessage(jid, { text: "❌ Reply to an image or video to make a sticker!\nUsage: Reply to image/video + `.sticker`" });
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});
      await sock.sendMessage(jid, {
        sticker: buffer,
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Could not make sticker: ${e.message}` });
    }
  },

  // ─── Tag All ─────────────────────────────────────────
  async tagall({ sock, jid, isGroup, isOwnerSender, text }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ Groups only!" });
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only!" });

    const meta = await sock.groupMetadata(jid);
    const members = meta.participants.map(p => p.id);
    const mentions = members.map(m => `@${m.replace("@s.whatsapp.net", "")}`).join(" ");

    await sock.sendMessage(jid, {
      text: `📢 *NEXUS-XD | Tag All*\n\n${text || "Attention everyone!"}\n\n${mentions}`,
      mentions: members,
    });
  },

  // ─── Ping ────────────────────────────────────────────
  async ping({ sock, jid }) {
    const start = Date.now();
    const sent = await sock.sendMessage(jid, { text: "🏓 Pinging..." });
    const ms = Date.now() - start;
    await sock.sendMessage(jid, {
      text: `🏓 *NEXUS-XD | Pong!*\n⚡ Response time: *${ms}ms*`,
      edit: sent.key,
    }).catch(async () => {
      await sock.sendMessage(jid, { text: `🏓 *Pong!* ⚡ *${ms}ms*` });
    });
  },

  // ─── Owner Info ──────────────────────────────────────
  async owner({ sock, jid, settings }) {
    const s = settings;
    await sock.sendMessage(jid, {
      text: `👑 *NEXUS-XD | Owner*\n\n📛 Name: ${s.ownerName}\n📞 Contact: wa.me/${s.ownerNumber}\n🤖 Bot: ${s.botName}`,
    });
  },

  // ─── Bot Info ────────────────────────────────────────
  async botinfo({ sock, jid, settings }) {
    const s = settings;
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const sec = Math.floor(uptime % 60);

    await sock.sendMessage(jid, {
      text: `🤖 *NEXUS-XD BOT INFO*\n\n📛 Name: ${s.botName}\n👑 Owner: ${s.ownerName}\n⚡ Prefix: ${s.prefix}\n🌐 Mode: ${s.botMode.toUpperCase()}\n⏱️ Uptime: ${h}h ${m}m ${sec}s\n💾 Memory: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB\n🖥️ Platform: ${process.platform}`,
    });
  },
};

module.exports = { commands };
