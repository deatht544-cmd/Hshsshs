const { jidDecode, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { loadSettings } = require("./settings");
const fs = require("fs");

// Get bare JID
function getBareJid(jid) {
  if (!jid) return jid;
  const decoded = jidDecode(jid);
  return decoded?.user && decoded?.server ? `${decoded.user}@${decoded.server}` : jid;
}

// Check if sender is owner
function isOwner(jid) {
  const settings = loadSettings();
  const senderNum = jid.replace(/[^0-9]/g, "").replace("@s.whatsapp.net", "");
  return senderNum === settings.ownerNumber;
}

// Get message text
function getMessageText(msg) {
  const m = msg.message;
  if (!m) return "";
  
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  );
}

// Get message type
function getMessageType(msg) {
  if (!msg.message) return null;
  const keys = Object.keys(msg.message);
  const filtered = keys.filter(k => k !== "messageContextInfo" && k !== "senderKeyDistributionMessage");
  return filtered[0] || null;
}

// Format number for display
function formatNumber(num) {
  return num.replace("@s.whatsapp.net", "").replace("@g.us", "");
}

// Format bytes
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Get group metadata safely
async function getGroupMeta(sock, jid) {
  try {
    return await sock.groupMetadata(jid);
  } catch {
    return null;
  }
}

// Download media
async function downloadMedia(msg) {
  try {
    const buffer = await downloadMediaMessage(msg, "buffer", {});
    return buffer;
  } catch (e) {
    return null;
  }
}

// Get quoted message
function getQuotedMessage(msg) {
  const m = msg.message;
  if (!m) return null;
  
  const extMsg = m.extendedTextMessage;
  if (extMsg?.contextInfo?.quotedMessage) {
    return {
      message: extMsg.contextInfo.quotedMessage,
      key: {
        remoteJid: msg.key.remoteJid,
        id: extMsg.contextInfo.stanzaId,
        participant: extMsg.contextInfo.participant,
      },
    };
  }
  
  // Check other message types
  for (const key of Object.keys(m)) {
    if (m[key]?.contextInfo?.quotedMessage) {
      return {
        message: m[key].contextInfo.quotedMessage,
        key: {
          remoteJid: msg.key.remoteJid,
          id: m[key].contextInfo.stanzaId,
          participant: m[key].contextInfo.participant,
        },
      };
    }
  }
  return null;
}

module.exports = {
  getBareJid,
  isOwner,
  getMessageText,
  getMessageType,
  formatNumber,
  formatBytes,
  getGroupMeta,
  downloadMedia,
  getQuotedMessage,
};
