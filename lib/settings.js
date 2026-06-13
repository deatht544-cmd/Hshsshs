const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, "../settings/config.json");

const defaultSettings = {
  // Bot Info
  botName: "NEXUS-XD",
  ownerName: "Vishath Kawshika",
  ownerNumber: "94725613084",
  prefix: ".",

  // Features Toggle
  antiDelete: true,
  antiCall: true,
  antiViewOnce: true,
  autoStatusSave: true,
  autoStatusSeen: true,
  autoStatusReact: true,
  autoSaveContact: true,

  // Presence
  alwaysOnline: false,
  alwaysOffline: false,

  // Anti-Call action: "reject" or "block"
  antiCallAction: "reject",

  // Status React Emoji
  statusReactEmoji: "🔥",

  // Menu Emoji
  menuEmoji: "⚡",

  // Bot Mode: "public" or "private"
  botMode: "public",
};

function loadSettings() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(SETTINGS_FILE)) {
    saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function updateSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}

module.exports = { loadSettings, saveSettings, updateSetting, defaultSettings };
