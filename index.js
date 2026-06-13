const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const { Boom } = require("@hapi/boom");

const { loadSettings } = require("./lib/settings");
const { handleMessage } = require("./main");

const msgStore = {};
const isGithubActions = process.env.NODE_ENV === "production";

async function startBot() {
  console.clear();
  console.log(`
╔══════════════════════════════════════╗
║       ⚡  NEXUS-XD BOT  ⚡           ║
║    Owner : Vishath Kawshika          ║
║    Mode  : ${isGithubActions ? "GitHub Actions  " : "Local           "}          ║
╚══════════════════════════════════════╝
`);

  if (!fs.existsSync("./session")) fs.mkdirSync("./session", { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: "silent" });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !isGithubActions,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["NEXUS-XD", "Chrome", "1.0.0"],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    getMessage: async (key) => msgStore[key.remoteJid]?.[key.id] || { conversation: "" },
  });

  sock.ev.on("messages.upsert", ({ messages }) => {
    for (const m of messages) {
      if (!m.key?.remoteJid || !m.key?.id) continue;
      if (!msgStore[m.key.remoteJid]) msgStore[m.key.remoteJid] = {};
      msgStore[m.key.remoteJid][m.key.id] = m;
    }
  });

  // QR - only local mode
  if (!isGithubActions && !sock.authState.creds.registered) {
    const qrcode = require("qrcode-terminal");
    sock.ev.on("connection.update", ({ qr }) => {
      if (qr) {
        console.log("\n📱 Scan QR with WhatsApp:\n");
        qrcode.generate(qr, { small: true });
        console.log("\nWhatsApp > Linked Devices > Link a Device\n");
      }
    });
  }

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`⚠️  Disconnected. Code: ${code}`);

      const noRestart = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        DisconnectReason.connectionReplaced,
      ];

      if (!noRestart.includes(code)) {
        console.log("🔄 Reconnecting in 5s...");
        setTimeout(startBot, 5000);
      } else {
        console.log("❌ Session invalid. Re-login required.");
        process.exit(0);
      }
    }

    if (connection === "open") {
      console.log("✅ NEXUS-XD Connected!\n");
      const s = loadSettings();
      const ownerJid = s.ownerNumber + "@s.whatsapp.net";
      setTimeout(async () => {
        await sock.sendMessage(ownerJid, {
          text: `⚡ *NEXUS-XD Online!*\n✅ Running on ${isGithubActions ? "GitHub Actions ☁️" : "Local 💻"}\nType *${s.prefix}menu* for commands 🚀`
        }).catch(() => {});
        if (s.alwaysOnline) await sock.sendPresenceUpdate("available").catch(() => {});
      }, 3000);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      try { await handleMessage(sock, msg, msgStore); }
      catch (e) { console.log("Handler error:", e.message); }
    }
  });
}

startBot().catch(console.error);
