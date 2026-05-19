const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

const TIKTOK_USERNAME = 'alldaynyc';
const PORT = process.env.PORT || 8080;
const EULER_API_KEY = 'euler_NDU4MjI3MjAxMDRhNzRlNmY2Yjc4MDRiMTM2MGU2OTYxN2E1ZTI3MWFiOWVhZDI1NzViMzI3';

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on port ${PORT}`);

let tiktok = null;
let clients = new Set();

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach(ws => {
    try { ws.send(msg); } catch(e) {}
  });
}

function connectTikTok() {
  console.log(`Connecting to TikTok: ${TIKTOK_USERNAME}`);
  tiktok = new WebcastPushConnection(TIKTOK_USERNAME, {
    signProviderOptions: {
      url: 'https://tiktok.eulerstream.com/webcast/sign_url',
      params: { apiKey: EULER_API_KEY }
    }
  });

  tiktok.connect().then(() => {
    console.log('TikTok connected!');
  }).catch(err => {
    console.warn('TikTok connect failed, retrying in 30s:', err.message);
    setTimeout(connectTikTok, 30000);
  });

  tiktok.on('chat', data => {
    broadcast({
      type: 'chat',
      username: data.uniqueId,
      nickname: data.nickname,
      comment: data.comment,
    });
  });

  tiktok.on('gift', data => {
    // Only broadcast when gift combo ends
    if (data.giftType === 1 && !data.repeatEnd) return;
    broadcast({
      type: 'gift',
      username: data.uniqueId,
      nickname: data.nickname,
      giftName: data.giftName,
      repeatCount: data.repeatCount || 1,
      diamondCount: data.diamondCount || 0,
    });
  });

  tiktok.on('disconnected', () => {
    console.warn('TikTok disconnected, retrying in 30s');
    setTimeout(connectTikTok, 30000);
  });

  tiktok.on('error', err => {
    console.warn('TikTok error:', err.message);
  });
}

wss.on('connection', ws => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

connectTikTok();    });
  });

  tiktok.on('gift', data => {
    if (data.giftType === 1 && !data.repeatEnd) return;
    broadcast({
      type: 'gift',
      username: data.uniqueId,
      nickname: data.nickname,
      giftName: data.giftName,
      repeatCount: data.repeatCount,
    });
  });

  tiktok.on('disconnected', () => {
    console.warn('TikTok disconnected, retrying in 30s');
    setTimeout(connectTikTok, 30000);
  });
}

wss.on('connection', ws => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

connectTikTok();
