const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'alldaynyc';
const PORT = process.env.PORT || 8080;
const EULER_API_KEY = process.env.EULER_API_KEY || '';

const wss = new WebSocketServer({ port: PORT });
console.log('WebSocket server running on port ' + PORT);

let clients = new Set();
let retryTimeout = null;
let tiktok = null;

function broadcast(data) {
  var msg = JSON.stringify(data);
  clients.forEach(function(ws) {
    try { ws.send(msg); } catch(e) {}
  });
}

function connectTikTok() {
  clearTimeout(retryTimeout);
  console.log('Connecting to TikTok: ' + TIKTOK_USERNAME);

  try {
    tiktok = new WebcastPushConnection(TIKTOK_USERNAME, {
      signProviderOptions: {
        url: 'https://tiktok.eulerstream.com/webcast/sign_url',
        params: { apiKey: EULER_API_KEY }
      }
    });
  } catch(e) {
    console.warn('Failed to create TikTok connection: ' + e.message);
    retryTimeout = setTimeout(connectTikTok, 60000);
    return;
  }

  tiktok.connect()
    .then(function() {
      console.log('TikTok connected!');
    })
    .catch(function(err) {
      var msg = (err && err.message) ? err.message : 'unknown';
      console.warn('TikTok connect failed (' + msg + '), retrying in 60s');
      try { tiktok.disconnect(); } catch(e) {}
      tiktok = null;
      retryTimeout = setTimeout(connectTikTok, 60000);
    });

  tiktok.on('chat', function(data) {
    try {
      broadcast({
        type: 'chat',
        username: data.uniqueId,
        nickname: data.nickname,
        comment: data.comment
      });
    } catch(e) {}
  });

  tiktok.on('gift', function(data) {
    try {
      if (data.giftType === 1 && !data.repeatEnd) return;
      broadcast({
        type: 'gift',
        username: data.uniqueId,
        nickname: data.nickname,
        giftName: data.giftName,
        repeatCount: data.repeatCount || 1,
        diamondCount: data.diamondCount || 0
      });
    } catch(e) {}
  });

  tiktok.on('disconnected', function() {
    console.warn('TikTok disconnected, retrying in 60s');
    tiktok = null;
    retryTimeout = setTimeout(connectTikTok, 60000);
  });

  tiktok.on('error', function(err) {
    var msg = (err && err.message) ? err.message : 'unknown';
    console.warn('TikTok error: ' + msg);
  });
}

wss.on('connection', function(ws) {
  clients.add(ws);
  console.log('Client connected. Total: ' + clients.size);
  ws.on('close', function() {
    clients.delete(ws);
    console.log('Client disconnected. Total: ' + clients.size);
  });
  ws.on('error', function(err) {
    console.warn('WS client error: ' + err.message);
    clients.delete(ws);
  });
});

wss.on('error', function(err) {
  console.warn('WSS error: ' + err.message);
});

process.on('uncaughtException', function(err) {
  console.warn('Uncaught exception (keeping alive): ' + ((err && err.message) ? err.message : String(err)));
});

process.on('unhandledRejection', function(reason) {
  console.warn('Unhandled rejection (keeping alive): ' + ((reason && reason.message) ? reason.message : String(reason)));
});

process.on('SIGTERM', function() {
  console.log('SIGTERM received — staying alive');
});

process.on('SIGINT', function() {
  console.log('SIGINT received — staying alive');
});

connectTikTok();
