# AllDay Chat — TikTok Live Server

This is the TikTok Live backend server for [AllDay Chat](https://alldaychat.app) — a free, open source tool that lets streamers see Twitch, YouTube, and TikTok chat in one feed.

---

## What this does

This Node.js server connects to your TikTok Live stream and forwards chat messages and gifts to the AllDay Chat app in real time via WebSocket. You deploy your own private copy so your TikTok data stays yours and you get your own unique server URL.

---

## Full Setup Guide

### Twitch (no setup needed)
Just enter your Twitch channel name in the app. Connects instantly — no API key or account required.

---

### YouTube Live Chat

1. Go to console.cloud.google.com
2. Create a new project (name it anything)
3. Search for YouTube Data API v3 → click Enable
4. Click Credentials → Create Credentials → API Key
5. In the dropdown select YouTube Data API v3 → hit Create
6. Copy your key (starts with AIza...)
7. Enter your YouTube handle and API key in AllDay Chat
8. App auto-detects your live stream — no video ID needed ever

Note: Free quota covers ~90 minutes of chat polling/day. Request a free increase at Google Cloud Console → YouTube Data API v3 → Quotas.

---

### TikTok Live Chat

Each streamer deploys their own private copy of this server and gets their own unique URL.

#### Step 1 — Fork this repo

1. Click the Fork button at the top right of this page
2. Click Create Fork
3. You now have your own copy at github.com/YOURUSERNAME/allchats-server

This gives you your own private deployment with your own unique Railway URL.

#### Step 2 — Get a free EulerStream API key

1. Go to eulerstream.com and sign in with Google
2. Click Sign API Account in the left sidebar
3. Scroll to API Keys → click Create your first key
4. Copy your API key (starts with euler_...)

#### Step 3 — Deploy YOUR fork to Railway

1. Go to railway.app and sign up with GitHub
2. Click New Project → GitHub Repository
3. Select YOUR forked repo (YOURUSERNAME/allchats-server)
4. Go to Variables tab and add:
   - TIKTOK_USERNAME = your TikTok username (without @)
   - EULER_API_KEY = your EulerStream API key
5. Click Deploy
6. Go to Settings → Networking → Generate Domain
7. Copy your unique Railway URL

Your URL is unique to your Railway account — nobody else has the same one.

#### Step 4 — Connect to AllDay Chat

1. Go to alldaychat.app
2. Expand the TikTok step
3. Paste your Railway URL into the field
4. Hit Start Watching
5. Go live on TikTok — TT dot turns green automatically

---

## Environment variables

| Variable | Description |
|---|---|
| TIKTOK_USERNAME | Your TikTok username without @ |
| EULER_API_KEY | Your EulerStream API key |

---

## Cost

| Service | Cost |
|---|---|
| AllDay Chat app | Free forever |
| Twitch IRC | Free |
| YouTube Data API v3 | Free (10,000 units/day) |
| EulerStream signing | Free (Community plan) |
| Railway hosting | ~$1-2/month (Hobby plan $5/month) |

---

## Supported events

Twitch: chat, subs, resubs, gift subs, bits, raids
YouTube: chat, superchats, super stickers
TikTok: chat, gifts (25+ coins)

---

## AllDay Chat

Frontend app at alldaychat.app — free, no account needed.
