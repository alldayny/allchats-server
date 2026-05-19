const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

const TIKTOK_USERNAME = 'alldaynyc';
const PORT = process.env.PORT || 8080;
const EULER_API_KEY = 'euler_NDU4MjI3MjAxMDRhNzRlNmY2Yjc4MDRiMTM2MGU2OTYxN2E1ZTI3MWFiOWVhZDI1NzViMzI3';

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server running on port ${PORT}`);

let clients = new Set();
let retryTimeout = null;

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach(ws => {
    try { ws.send(msg); } catch(e) {}
  });
}

function connectTikTok() {
  clearTimeout(retryTimeout);
  console.log('Connecting to TikTok: ' + TIKTOK_USERNAME);
  let tiktok;
  try {
    tiktok = new WebcastPushConnection(TIKTOK_USERNAME, {
      signProviderOptions: {
        url: 'https://tiktok.eulerstream.com/webcast/sign_url',
        params: { apiKey: EULER_API_KEY }
      }
    });
  } catch(e) {
    console.warn('Failed to create connection, retrying in 60s');
    retryTimeout = setTimeout(connectTikTok, 60000);
    return;
  }

  tiktok.connect()
    .then(function() {
      console.log('TikTok connected!');
    })
    .catch(function(err) {
      var msg = (err && err.message) ? err.message : 'unknown';
      console.warn('TikTok not available (' + msg + '), retrying in 60s');
      try { tiktok.disconnect(); } catch(e) {}
      retryTimeout = setTimeout(connectTikTok, 60000);
    });

  tiktok.on('chat', function(data) {
    broadcast({
      type: 'chat',
      username: data.uniqueId,
      nickname: data.nickname,
      comment: data.comment
    });
  });

  tiktok.on('gift', function(data) {
    if (data.giftType === 1 && !data.repeatEnd) return;
    broadcast({
      type: 'gift',
      username: data.uniqueId,
      nickname: data.nickname,
      giftName: data.giftName,
      repeatCount: data.repeatCount || 1,
      diamondCount: data.diamondCount || 0
    });
  });

  tiktok.on('disconnected', function() {
    console.warn('TikTok disconnected, retrying in 60s');
    retryTimeout = setTimeout(connectTikTok, 60000);
  });

  tiktok.on('error', function(err) {
    var msg = (err && err.message) ? err.message : 'unknown';
    console.warn('TikTok error: ' + msg);
  });
}

process.on('uncaughtException', function(err) {
  console.warn('Uncaught exception: ' + ((err && err.message) ? err.message : err));
});

process.on('unhandledRejection', function(err) {
  console.warn('Unhandled rejection: ' + ((err && err.message) ? err.message : err));
});

wss.on('connection', function(ws) {
  clients.add(ws);
  console.log('Client connected. Total: ' + clients.size);
  ws.on('close', function() {
    clients.delete(ws);
    console.log('Client disconnected. Total: ' + clients.size);
  });
});

connectTikTok();
