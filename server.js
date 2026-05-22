import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const PORT = process.env.PORT || 8080;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || 'alldaynyc';
const EULER_API_KEY = process.env.EULER_API_KEY || '';

const wss = new WebSocketServer({ port: PORT });
console.log('WebSocket server running on port ' + PORT);

let clients = new Set();
let retryTimeout = null;
let tiktok = null;

function broadcast(data) {
  const msg = JSON.stringify(data);
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

  tiktok.on(ControlEvent.CONNECTED, (state) => {
    console.log('TikTok connected! roomId: ' + state.roomId);
    broadcast({ type: 'tiktok_connected' });
  });

  tiktok.on(ControlEvent.DISCONNECTED, ({ code, reason }) => {
    console.log('TikTok disconnected (' + code + '): ' + (reason || ''));
    broadcast({ type: 'tiktok_disconnected' });
    retryTimeout = setTimeout(connectTikTok, 30000);
  });

  tiktok.on(ControlEvent.ERROR, (err) => {
    console.error('TikTok error:', err.message || err);
  });

  tiktok.on(WebcastEvent.CHAT, (data) => {
    const uniqueId = data.user?.uniqueId || 'unknown';
    const nickname = data.user?.nickname || uniqueId;
    const comment = data.comment || '';
    console.log('[CHAT] ' + nickname + ': ' + comment);
    broadcast({
      type: 'chat',
      platform: 'tiktok',
      uniqueId,
      nickname,
      comment,
      profilePictureUrl: data.user?.profilePictureUrl || null
    });
  });

  tiktok.on(WebcastEvent.GIFT, (data) => {
    const giftType = data.giftDetails?.giftType;
    if (giftType === 1 && !data.repeatEnd) return;
    const coinCost = data.giftDetails?.diamondCount || 0;
    if (coinCost < 25) return;
    const uniqueId = data.user?.uniqueId || 'unknown';
    const nickname = data.user?.nickname || uniqueId;
    const giftName = data.giftDetails?.giftName || 'Gift';
    console.log('[GIFT] ' + nickname + ' sent ' + giftName + ' (' + coinCost + ' coins)');
    broadcast({
      type: 'gift',
      platform: 'tiktok',
      uniqueId,
      nickname,
      giftName,
      coinCost,
      repeatCount: data.repeatCount || 1,
      profilePictureUrl: data.user?.profilePictureUrl || null
    });
  });

  tiktok.connect()
    .then(state => console.log('TikTok connected to roomId: ' + (state && state.roomId)))
    .catch(err => {
      console.error('TikTok connection failed:', err.message || err);
      retryTimeout = setTimeout(connectTikTok, 60000);
    });
}

wss.on('connection', function(ws) {
  clients.add(ws);
  console.log('WebSocket client connected. Total: ' + clients.size);
  ws.on('close', function() {
    clients.delete(ws);
    console.log('WebSocket client disconnected. Total: ' + clients.size);
  });
});

connectTikTok();
