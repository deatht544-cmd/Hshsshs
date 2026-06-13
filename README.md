# ⚡ NEXUS-XD WhatsApp Bot

> **Owner:** Vishath Kawshika | **Number:** +94725613084

---

## 📲 Termux Installation Guide

### Step 1 – Setup Termux
```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

### Step 2 – Clone / Copy Bot
```bash
# If using git:
git clone <your-repo-url> NEXUS-XD
cd NEXUS-XD

# OR create folder manually and copy files:
mkdir NEXUS-XD && cd NEXUS-XD
```

### Step 3 – Install Dependencies
```bash
npm install
```

### Step 4 – Start the Bot
```bash
node index.js
```

### Step 5 – Connect via Pairing Code (NO QR!)
1. Bot will ask: **"Enter your WhatsApp number"**
2. Type your number: `94725613084`
3. You'll get a **8-character pairing code** like: `ABCD-EFGH`
4. Open WhatsApp → **Linked Devices** → **Link with phone number**
5. Enter the pairing code
6. ✅ Connected!

---

## 📁 File Structure
```
NEXUS-XD/
├── index.js          # Bot startup & connection
├── main.js           # Message handler & menu
├── package.json
├── lib/
│   ├── settings.js   # Settings manager
│   └── utils.js      # Helper functions
├── plugins/
│   ├── settings.js   # All toggle commands
│   ├── group.js      # Group management
│   └── tools.js      # Tools (getdp, sticker, etc)
├── settings/
│   └── config.json   # Auto-generated settings file
├── session/          # Auto-generated session files
└── downloads/
    └── status/       # Auto-saved status media
```

---

## 🔧 All Commands

### ⚙️ Settings
| Command | Description |
|---------|-------------|
| `.menu` | Main menu |
| `.settings` | Settings panel |
| `.online` | Always online mode |
| `.offline` | Always offline mode |
| `.normalmode` | Remove presence override |
| `.setemoji 🔥` | Change status react emoji |
| `.setprefix !` | Change command prefix |
| `.setmenuemoji ⚡` | Change menu emoji |
| `.mode public/private` | Bot access mode |

### 🛡️ Protection
| Command | Description |
|---------|-------------|
| `.antidelete` | Toggle anti-delete |
| `.anticall` | Toggle anti-call |
| `.antiviewonce` | Toggle anti-view-once |

### 📊 Status
| Command | Description |
|---------|-------------|
| `.statussave` | Toggle status auto-save |
| `.statusseen` | Toggle status auto-seen |
| `.statusreact` | Toggle status auto-react |
| `.statusauto on/off` | Toggle all status features |

### 👥 Group
| Command | Description |
|---------|-------------|
| `.groupinfo` | Show group details |
| `.kick @user` | Kick member |
| `.add 94xxx` | Add member |
| `.promote @user` | Promote to admin |
| `.demote @user` | Remove admin |
| `.tagall [msg]` | Tag all members |

### 🔧 Tools
| Command | Description |
|---------|-------------|
| `.getdp @user` | Get profile picture |
| `.sticker` | Reply to image → make sticker |
| `.ping` | Check bot response time |
| `.owner` | Owner contact info |
| `.botinfo` | Bot information |

---

## ➕ Adding Custom Plugins

Create a new file in `/plugins/` folder:

```js
// plugins/myplugin.js

const commands = {
  async hello({ sock, jid, text }) {
    await sock.sendMessage(jid, { 
      text: `👋 Hello! You said: ${text}` 
    });
  },
};

module.exports = { commands };
```

The bot auto-loads all plugins from `/plugins/` — just restart!

---

## 🔄 Keep Bot Running (Termux)
```bash
# Install screen
pkg install screen -y

# Start in screen session
screen -S nexus
node index.js

# Detach: Ctrl+A then D
# Reattach: screen -r nexus
```

---

*Made with ❤️ by Vishath Kawshika | NEXUS-XD v2.0*
