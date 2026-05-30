import { readFileSync } from 'fs';
import DiscordRPC from 'discord-rpc';
import { WebSocketServer } from 'ws';

// Load .env for convenience
try {
  const env = readFileSync('.env', 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([^#\s=]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID || process.argv[2];
const WS_PORT = parseInt(process.env.BRIDGE_PORT || '6474', 10);

if (!CLIENT_ID) {
  console.error('Usage: node bridge.js <DISCORD_CLIENT_ID>');
  console.error('Or set VITE_DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

let activity = null;
let rpc = null;

async function connect() {
  DiscordRPC.register(CLIENT_ID);
  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    console.log('[bridge] Discord RPC connected');
    if (activity) rpc.setActivity(activity).catch(() => {});
  });

  rpc.on('disconnected', () => {
    console.log('[bridge] Discord RPC disconnected, reconnecting in 15s...');
    setTimeout(connect, 15000);
  });

  try {
    await rpc.connect({ clientId: CLIENT_ID });
  } catch (e) {
    console.error('[bridge] Failed to connect to Discord:', e.message);
    console.log('[bridge] Make sure Discord desktop is running');
    console.log('[bridge] Retrying in 30s...');
    setTimeout(connect, 30000);
  }
}

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[bridge] WebSocket server on ws://localhost:${WS_PORT}`);

wss.on('connection', (ws) => {
  console.log('[bridge] WebSocket client connected');

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'presence') {
        activity = {
          details: msg.details || '',
          state: msg.state || '',
          startTimestamp: msg.startTimestamp,
          endTimestamp: msg.endTimestamp,
          largeImageKey: msg.largeImageKey || 'music',
          largeImageText: msg.largeImageText || '',
          smallImageKey: msg.smallImageKey || 'play',
          smallImageText: msg.smallImageText || '',
          instance: false,
        };
        if (rpc?.user) {
          rpc.setActivity(activity).catch(() => {});
        }
        ws.send(JSON.stringify({ type: 'presence_ack' }));
      }

      if (msg.type === 'clear') {
        activity = null;
        if (rpc?.user) rpc.clearActivity().catch(() => {});
        ws.send(JSON.stringify({ type: 'clear_ack' }));
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', connected: !!rpc?.user }));
      }
    } catch (e) {
      console.error('[bridge] Invalid message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[bridge] WebSocket client disconnected');
  });

  ws.send(JSON.stringify({ type: 'connected', discord: !!rpc?.user }));
});

connect();

process.on('SIGINT', () => {
  if (rpc) rpc.destroy().catch(() => {});
  wss.close();
  process.exit(0);
});
