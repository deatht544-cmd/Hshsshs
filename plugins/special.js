const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

const commands = {

  // .getdp
  async getdp({ sock, jid, msg }) {
    const target =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
      msg.message?.extendedTextMessage?.contextInfo?.participant || jid;
    try {
      const url = await sock.profilePictureUrl(target, "image");
      await sock.sendMessage(jid, { image: { url }, caption: "📸 *Profile Picture | NEXUS-XD*" }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: "❌ No profile picture found or it's private." }, { quoted: msg });
    }
  },

  // .save - reply to media
  async save({ sock, jid, msg }) {
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!q) return sock.sendMessage(jid, { text: "❌ Reply to an image or video with `.save`" });
    const type = Object.keys(q)[0];
    if (!["imageMessage", "videoMessage"].includes(type))
      return sock.sendMessage(jid, { text: "❌ Only image or video!" });
    try {
      const mt = type === "imageMessage" ? "image" : "video";
      const stream = await downloadContentFromMessage(q[type], mt);
      let buf = Buffer.from([]);
      for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
      await sock.sendMessage(jid, { [mt]: buf, caption: "✅ *Saved by NEXUS-XD*" }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Failed: ${e.message}` });
    }
  },

  // .viewonce - bypass view once
  async viewonce({ sock, jid, msg }) {
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!q) return sock.sendMessage(jid, { text: "❌ Reply to a view once message!" });
    const vo = q.viewOnceMessage?.message || q.viewOnceMessageV2?.message;
    if (!vo) return sock.sendMessage(jid, { text: "❌ Not a view once message!" });
    const type = Object.keys(vo)[0];
    try {
      const mt = type === "imageMessage" ? "image" : "video";
      const stream = await downloadContentFromMessage(vo[type], mt);
      let buf = Buffer.from([]);
      for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
      await sock.sendMessage(jid, { [mt]: buf, caption: "🔓 *View Once Opened | NEXUS-XD*" }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: `❌ Failed: ${e.message}` });
    }
  },

  // .userinfo
  async userinfo({ sock, jid, msg }) {
    const target =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
      msg.message?.extendedTextMessage?.contextInfo?.participant || jid;
    let bio = "No bio";
    try { const s = await sock.fetchStatus(target); bio = s?.status || "No bio"; } catch {}
    let pp = null;
    try { pp = await sock.profilePictureUrl(target, "image"); } catch {}
    const text = `*👤 USER INFO | NEXUS-XD*\n\n• *Number:* wa.me/${target.split("@")[0]}\n• *Bio:* ${bio}`;
    if (pp) await sock.sendMessage(jid, { image: { url: pp }, caption: text }, { quoted: msg });
    else await sock.sendMessage(jid, { text }, { quoted: msg });
  },

};

module.exports = { commands };
