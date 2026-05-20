# AllDay Chat — Live Server

This is the backend server for [AllDay Chat](https://alldaychat.app) — a free, open source tool that lets streamers see Twitch, YouTube, and TikTok chat in one feed.

---

## What this does

This Node.js server connects to your TikTok Live stream and forwards chat messages and gifts to the AllDay Chat app in real time via WebSocket. Twitch and YouTube connect directly from the browser — no server needed for those.

---

## Full Setup Guide

### Twitch (no setup needed)
Just enter your Twitch channel name in the app. Chat connects instantly with no account or API key required.

---

### YouTube Live Chat

YouTube requires a free API key to read live chat.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (name it anything)
3. Search for **YouTube Data API v3** → click **Enable**
4. Click **Credentials** → **Create Credentials** → **API Key**
5. Copy your key (starts with `AIza...`)
6. Enter your YouTube handle and API key in the AllDay Chat setup screen
7. The app auto-detects your live stream when you go live — no video ID needed

**Note:** The free quota is 10,000 units/day which covers roughly 90 minutes of live chat polling. To extend this, request a quota increase at Google Cloud Console → YouTube Data API v3 → Quotas.

---

### TikTok Live Chat

TikTok requires a backend signing server. Follow these steps to deploy your own for free.

#### Step 1 — Get a free EulerStream API key

1. Go to [eulerstream.com](https://eulerstream.com) and sign in with Google
2. Click **Sign API Account** in the dashboard
3. Click **Create your first key**
4. Copy your API key (starts with `euler_...`)

#### Step 2 — Deploy this server to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project** → **GitHub Repository** → select this repo
3. Go to **Variables** tab and add:
   - `TIKTOK_USERNAME` = your TikTok username (without @)
   - `EULER_API_KEY` = your EulerStream API key
4. Click **Deploy**
5. Go to **Settings** → **Networking** → **Generate Domain**
6. Copy your Railway URL (e.g. `your-server.up.railway.app`)

#### Step 3 — Add your server to AllDay Chat

1. Go to [alldaychat.app](https://alldaychat.app)
2. Paste your Railway URL into the TikTok server field
3. Hit **Start Watching**
4. Go live on TikTok — the TT dot turns green automatically 🟢

---

## Environment variables

| Variable | Description |
|---|---|
| `TIKTOK_USERNAME` | Your TikTok username without @ |
| `EULER_API_KEY` | Your EulerStream API key |

---

## Cost breakdown

| Service | Cost |
|---|---|
| Netlify (frontend) | Free |
| Twitch IRC | Free |
| YouTube Data API v3 | Free (10,000 units/day) |
| EulerStream signing | Free (Community plan) |
| Railway hosting | ~$1-2/month (Hobby plan $5/month) |
| **Total** | **~$2-5/month** |

---

## Supported events

**Twitch**
- 💬 Chat messages with emotes (Twitch, BTTV, FFZ)
- ⭐ Subscriptions and resubscriptions
- 🎁 Gift subs and gift bombs
- 💎 Bits/cheers
- 🚨 Raids

**YouTube**
- 💬 Chat messages
- 💛 Superchats
- 🌟 Super Stickers

**TikTok**
- 💬 Chat messages
- 🎁 Gifts (25+ coins)

---

## Tech stack

- Node.js
- [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector)
- [ws](https://github.com/websockets/ws)
- [EulerStream](https://eulerstream.com)

---

## AllDay Chat

The frontend app is at [alldaychat.app](https://alldaychat.app) — free, no account needed. All settings are saved locally in your browser so you only have to set up once.
