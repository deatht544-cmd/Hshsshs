const { getGroupMeta } = require("../lib/utils");

const commands = {
  // ─── Group Info ──────────────────────────────────────
  async groupinfo({ sock, jid, isGroup, sender }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ This command only works in groups!" });

    const meta = await getGroupMeta(sock, jid);
    if (!meta) return sock.sendMessage(jid, { text: "❌ Could not fetch group info." });

    const admins = meta.participants.filter(p => p.admin).map(p => p.id);
    const members = meta.participants.length;
    const created = new Date(meta.creation * 1000).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const info = `
╔════════════════════════╗
║  👥 *GROUP INFORMATION*  ║
╚════════════════════════╝

📛 *Name:* ${meta.subject}
🆔 *ID:* ${jid.replace("@g.us", "")}
📅 *Created:* ${created}
👤 *Creator:* wa.me/${meta.owner?.replace("@s.whatsapp.net", "") || "Unknown"}
👥 *Members:* ${members}
👑 *Admins:* ${admins.length}
📝 *Description:*
${meta.desc || "No description set."}

👑 *Admin List:*
${admins.map(a => `• wa.me/${a.replace("@s.whatsapp.net", "")}`).join("\n")}
`.trim();

    await sock.sendMessage(jid, { text: info });
  },

  // ─── Kick Member ────────────────────────────────────
  async kick({ sock, jid, isGroup, isOwnerSender, msg, args }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ Groups only!" });
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only!" });

    const meta = await getGroupMeta(sock, jid);
    const botId = sock.user.id.replace(/:.*/, "") + "@s.whatsapp.net";
    const isAdmin = meta?.participants.find(p => p.id === botId)?.admin;
    if (!isAdmin) return sock.sendMessage(jid, { text: "❌ Bot must be admin to kick!" });

    let target = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                 (args[0] ? args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null);

    if (!target) return sock.sendMessage(jid, { text: "❌ Mention or provide number to kick!\nUsage: `.kick @user` or `.kick 94xxxxxxxxx`" });

    await sock.groupParticipantsUpdate(jid, [target], "remove");
    await sock.sendMessage(jid, {
      text: `👢 *NEXUS-XD | Kick*\n\n✅ @${target.replace("@s.whatsapp.net", "")} has been kicked from the group!`,
      mentions: [target],
    });
  },

  // ─── Add Member ─────────────────────────────────────
  async add({ sock, jid, isGroup, isOwnerSender, args }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ Groups only!" });
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only!" });

    const num = args[0]?.replace(/[^0-9]/g, "");
    if (!num) return sock.sendMessage(jid, { text: "❌ Usage: `.add 94xxxxxxxxx`" });

    const target = num + "@s.whatsapp.net";
    const result = await sock.groupParticipantsUpdate(jid, [target], "add");
    const status = result?.[0]?.status;

    if (status === "200") {
      await sock.sendMessage(jid, { text: `✅ @${num} added to group!`, mentions: [target] });
    } else if (status === "408") {
      await sock.sendMessage(jid, { text: `❌ @${num} is not on WhatsApp or number is wrong.`, mentions: [target] });
    } else {
      await sock.sendMessage(jid, { text: `⚠️ Could not add @${num}. Status: ${status}`, mentions: [target] });
    }
  },

  // ─── Promote ─────────────────────────────────────────
  async promote({ sock, jid, isGroup, isOwnerSender, msg, args }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ Groups only!" });
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only!" });

    const target = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                   (args[0] ? args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null);
    if (!target) return sock.sendMessage(jid, { text: "❌ Mention user to promote!" });

    await sock.groupParticipantsUpdate(jid, [target], "promote");
    await sock.sendMessage(jid, {
      text: `⭐ *NEXUS-XD | Promote*\n\n✅ @${target.replace("@s.whatsapp.net", "")} is now an admin!`,
      mentions: [target],
    });
  },

  // ─── Demote ──────────────────────────────────────────
  async demote({ sock, jid, isGroup, isOwnerSender, msg, args }) {
    if (!isGroup) return sock.sendMessage(jid, { text: "❌ Groups only!" });
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only!" });

    const target = msg.message?.extendedTextMessage?.contextInfo?.participant ||
                   (args[0] ? args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null);
    if (!target) return sock.sendMessage(jid, { text: "❌ Mention user to demote!" });

    await sock.groupParticipantsUpdate(jid, [target], "demote");
    await sock.sendMessage(jid, {
      text: `⬇️ *NEXUS-XD | Demote*\n\n✅ @${target.replace("@s.whatsapp.net", "")} is no longer an admin.`,
      mentions: [target],
    });
  },
};

module.exports = { commands };
