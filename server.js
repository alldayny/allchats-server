const { WebcastPushConnection } = require('tiktok-live-connector');
const { WebSocketServer } = require('ws');

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'alldaynyc';
const PORT = process.env.PORT || 8080;
const EULER_API_KEY = process.env.EULER_API_KEY || '';

const RETRY_NOT_LIVE = 5 * 60 * 1000;
const RETRY_DROPPED  = 30 * 1000;

const wss = new WebSocketServer({ port: PORT });
console.log('WebSocket server running on port ' + PORT);

let clients = new Set();
let retryTimeout = null;
let tiktok = null;
let wasLive = false;

function broadcast(data) {
  var msg = JSON.stringify(data);
  console.log('Broadcasting:', msg.substring(0, 150));
  clients.forEach(function(ws) {
    try { ws.send(msg); } catch(e) {}
  });
}

function destroyTikTok() {
  if (tiktok) {
    try { tiktok.removeAllListeners(); } catch(e) {}
    try { tiktok.disconnect(); } catch(e) {}
    tiktok = null;
  }
}

function connectTikTok() {
  clearTimeout(retryTimeout);
  destroyTikTok();

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
    retryTimeout = setTimeout(connectTikTok, RETRY_NOT_LIVE);
    return;
  }

  tiktok.connect()
    .then(function() {
      console.log('TikTok connected!');
      wasLive = true;

      // Debug — log ALL events to see what v2 actually emits
      tiktok.on('*', function(eventName, data) {
        console.log('TikTok event fired:', eventName);
      });
    })
    .catch(function(err) {
      var msg = (err && err.message) ? err.message : 'unknown';
      console.warn('TikTok connect failed (' + msg + '), retrying in 5min');
      destroyTikTok();
      wasLive = false;
      retryTimeout = setTimeout(connectTikTok, RETRY_NOT_LIVE);
    });

  tiktok.on('chat', function(data) {
    try {
      var nickname = (data.user && data.user.nickname) || data.nickname || data.uniqueId || 'Unknown';
      var uniqueId = (data.user && data.user.uniqueId) || data.uniqueId || '';
      var comment = (data.data && data.data.comment) || data.comment || '';
      console.log('Chat received from:', nickname, ':', comment);
      broadcast({ type: 'chat', username: uniqueId, nickname: nickname, comment: comment });
    } catch(e) { console.warn('Chat handler error:', e.message); }
  });

  tiktok.on('gift', function(data) {
    try {
      if (data.giftType === 1 && !data.repeatEnd) return;
      var nickname = (data.user && data.user.nickname) || data.nickname || 'Unknown';
      var uniqueId = (data.user && data.user.uniqueId) || data.uniqueId || '';
      var giftName = (data.giftDetails && data.giftDetails.giftName) || data.giftName || 'Gift';
      var diamondCount = (data.giftDetails && data.giftDetails.diamondCount) || data.diamondCount || 0;
      var repeatCount = data.repeatCount || 1;
      broadcast({ type: 'gift', username: uniqueId, nickname: nickname, giftName: giftName, repeatCount: repeatCount, diamondCount: diamondCount });
    } catch(e) { console.warn('Gift handler error:', e.message); }
  });

  tiktok.on('disconnected', function() {
    console.warn('TikTok stream ended — retrying');
    destroyTikTok();
    var delay = wasLive ? RETRY_DROPPED : RETRY_NOT_LIVE;
    wasLive = false;
    retryTimeout = setTimeout(connectTikTok, delay);
  });

  tiktok.on('error', function(err) {
    var msg = (err && err.message) ? err.message : 'unknown';
    console.warn('TikTok error: ' + msg);
    destroyTikTok();
    retryTimeout = setTimeout(connectTikTok, RETRY_NOT_LIVE);
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
  console.warn('Uncaught exception: ' + ((err && err.message) ? err.message : String(err)));
});

process.on('unhandledRejection', function(reason) {
  console.warn('Unhandled rejection: ' + ((reason && reason.message) ? reason.message : String(reason)));
});

process.on('SIGTERM', function() {
  console.log('SIGTERM received — staying alive');
});

process.on('SIGINT', function() {
  console.log('SIGINT received — staying alive');
});

connectTikTok();
