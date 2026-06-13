const { updateSetting, loadSettings } = require("../lib/settings");

const commands = {
  // ─── Anti Delete ───────────────────────────────────
  async antidelete({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.antiDelete;
    updateSetting("antiDelete", val);
    await sock.sendMessage(jid, {
      text: `🗑️ *Anti-Delete* ${val ? "✅ Enabled" : "❌ Disabled"}\nDeleted messages will ${val ? "now" : "no longer"} be recovered.`,
    });
  },

  // ─── Anti Call ──────────────────────────────────────
  async anticall({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.antiCall;
    updateSetting("antiCall", val);
    await sock.sendMessage(jid, {
      text: `📵 *Anti-Call* ${val ? "✅ Enabled" : "❌ Disabled"}\nIncoming calls will ${val ? "now" : "no longer"} be rejected automatically.`,
    });
  },

  // ─── Anti View Once ─────────────────────────────────
  async antiviewonce({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.antiViewOnce;
    updateSetting("antiViewOnce", val);
    await sock.sendMessage(jid, {
      text: `👁️ *Anti-View-Once* ${val ? "✅ Enabled" : "❌ Disabled"}\nView-once messages will ${val ? "now" : "no longer"} be revealed.`,
    });
  },

  // ─── Status Save ────────────────────────────────────
  async statussave({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.autoStatusSave;
    updateSetting("autoStatusSave", val);
    await sock.sendMessage(jid, {
      text: `💾 *Auto Status Save* ${val ? "✅ Enabled" : "❌ Disabled"}`,
    });
  },

  // ─── Status Seen ─────────────────────────────────────
  async statusseen({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.autoStatusSeen;
    updateSetting("autoStatusSeen", val);
    await sock.sendMessage(jid, {
      text: `👀 *Auto Status Seen* ${val ? "✅ Enabled" : "❌ Disabled"}`,
    });
  },

  // ─── Status React ────────────────────────────────────
  async statusreact({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.autoStatusReact;
    updateSetting("autoStatusReact", val);
    await sock.sendMessage(jid, {
      text: `${settings.statusReactEmoji} *Auto Status React* ${val ? "✅ Enabled" : "❌ Disabled"}`,
    });
  },

  // ─── Status Auto (all in one) ────────────────────────
  async statusauto({ sock, jid, isOwnerSender, args }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const on = args[0]?.toLowerCase() === "on";
    const off = args[0]?.toLowerCase() === "off";
    if (!on && !off) {
      return sock.sendMessage(jid, { text: "Usage: `.statusauto on` or `.statusauto off`" });
    }
    const val = on;
    updateSetting("autoStatusSave", val);
    updateSetting("autoStatusSeen", val);
    updateSetting("autoStatusReact", val);
    await sock.sendMessage(jid, {
      text: `📊 *All Status Features* ${val ? "✅ Enabled" : "❌ Disabled"}\n\n• Auto Save: ${val ? "✅" : "❌"}\n• Auto Seen: ${val ? "✅" : "❌"}\n• Auto React: ${val ? "✅" : "❌"}`,
    });
  },

  // ─── Always Online ───────────────────────────────────
  async online({ sock, jid, isOwnerSender }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    updateSetting("alwaysOnline", true);
    updateSetting("alwaysOffline", false);
    await sock.sendPresenceUpdate("available");
    await sock.sendMessage(jid, {
      text: "🟢 *Always Online* ✅ Enabled\nYour status is now always ONLINE.",
    });
  },

  // ─── Always Offline ──────────────────────────────────
  async offline({ sock, jid, isOwnerSender }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    updateSetting("alwaysOnline", false);
    updateSetting("alwaysOffline", true);
    await sock.sendPresenceUpdate("unavailable");
    await sock.sendMessage(jid, {
      text: "⚫ *Always Offline* ✅ Enabled\nYour status is now always OFFLINE.",
    });
  },

  // ─── Normal Mode (remove presence) ──────────────────
  async normalmode({ sock, jid, isOwnerSender }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    updateSetting("alwaysOnline", false);
    updateSetting("alwaysOffline", false);
    await sock.sendPresenceUpdate("unavailable");
    await sock.sendMessage(jid, {
      text: "⚙️ *Normal Mode* ✅ Set\nPresence will show naturally based on your usage.",
    });
  },

  // ─── Set React Emoji ────────────────────────────────
  async setemoji({ sock, jid, isOwnerSender, args }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const emoji = args[0];
    if (!emoji) return sock.sendMessage(jid, { text: "Usage: `.setemoji 🔥`\nProvide an emoji!" });
    updateSetting("statusReactEmoji", emoji);
    await sock.sendMessage(jid, {
      text: `${emoji} *Status React Emoji* updated!\nStatus will now be reacted with: ${emoji}`,
    });
  },

  // ─── Set Prefix ──────────────────────────────────────
  async setprefix({ sock, jid, isOwnerSender, args }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const newPrefix = args[0];
    if (!newPrefix) return sock.sendMessage(jid, { text: "Usage: `.setprefix !`\nProvide a prefix character!" });
    updateSetting("prefix", newPrefix);
    await sock.sendMessage(jid, {
      text: `⚙️ *Prefix* updated to: *${newPrefix}*\nAll commands now start with \`${newPrefix}\`\nExample: \`${newPrefix}menu\``,
    });
  },

  // ─── Set Menu Emoji ──────────────────────────────────
  async setmenuemoji({ sock, jid, isOwnerSender, args }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const emoji = args[0];
    if (!emoji) return sock.sendMessage(jid, { text: "Usage: `.setmenuemoji ⚡`" });
    updateSetting("menuEmoji", emoji);
    await sock.sendMessage(jid, {
      text: `${emoji} *Menu Emoji* updated to: ${emoji}`,
    });
  },

  // ─── Bot Mode ────────────────────────────────────────
  async mode({ sock, jid, isOwnerSender, args }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const mode = args[0]?.toLowerCase();
    if (!["public", "private"].includes(mode)) {
      return sock.sendMessage(jid, { text: "Usage: `.mode public` or `.mode private`" });
    }
    updateSetting("botMode", mode);
    await sock.sendMessage(jid, {
      text: `🤖 *Bot Mode* set to: *${mode.toUpperCase()}*\n${mode === "public" ? "Everyone can use the bot!" : "Only owner can use the bot!"}`,
    });
  },

  // ─── Auto Save Contact ───────────────────────────────
  async savecontact({ sock, jid, isOwnerSender, settings }) {
    if (!isOwnerSender) return sock.sendMessage(jid, { text: "❌ Owner only command!" });
    const val = !settings.autoSaveContact;
    updateSetting("autoSaveContact", val);
    await sock.sendMessage(jid, {
      text: `📒 *Auto Save Contact* ${val ? "✅ Enabled" : "❌ Disabled"}`,
    });
  },
};

module.exports = { commands };
