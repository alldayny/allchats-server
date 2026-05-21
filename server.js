const { TikTokLiveConnection } = require('tiktok-live-connector');
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
          tiktok = new TikTokLiveConnection(TIKTOK_USERNAME, {
                  signApiKey: EULER_API_KEY || undefined
          });
    } catch(e) {
          console.warn('Failed to create TikTok connection: ' + e.message);
          retryTimeout = setTimeout(connectTikTok, 60000);
          return;
    }

  tiktok.connect()
      .then(function() { console.log('TikTok connected!'); })
      .catch(function(err) {
              console.warn('TikTok connect failed: ' + (err && err.message));
              retryTimeout = setTimeout(connectTikTok, 30000);
      });

  tiktok.on('chat', function(data) {
        try {
                broadcast({
                          type: 'chat',
                          username: data.user && data.user.uniqueId,
                          nickname: data.user && data.user.nickname,
                          comment: data.comment
                });
        } catch(e) {}
  });

  tiktok.on('gift', function(data) {
        try {
                var giftType = data.giftDetails && data.giftDetails.giftType;
                if (giftType === 1 && !data.repeatEnd) return;
                broadcast({
                          type: 'gift',
                          username: data.user && data.user.uniqueId,
                          nickname: data.user && data.user.nickname,
                          giftName: data.giftDetails && data.giftDetails.giftName,
                          repeatCount: data.repeatCount || 1,
                          diamondCount: (data.giftDetails && data.giftDetails.diamondCount) || 0
                });
        } catch(e) {}
  });

  tiktok.on('disconnected', function() {
        console.warn('TikTok disconnected. Reconnecting in 30s...');
        retryTimeout = setTimeout(connectTikTok, 30000);
  });

  tiktok.on('error', function(err) {
        var info = err && err.info;
        var exception = err && err.exception;
        var msg = (exception && exception.message) || info || 'unknown';
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
    ws.on('error', function() {});
});

process.on('uncaughtException', function(err) {
    console.warn('uncaughtException: ' + (err && err.message));
});
process.on('unhandledRejection', function(err) {
    console.warn('unhandledRejection: ' + (err && err.message));
});

connectTikTok();
