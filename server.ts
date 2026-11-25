import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';

type HeroPartOwner = 'nikita' | 'roner' | 'sasha';
type GameMode =
  | 'story_act1'
  | 'story_act2'
  | 'story_act3'
  | 'story_act4'
  | 'first_person'
  | 'hardcore_third_person'
  | 'fnaf_epta'
  | 'sniper_minigame'
  | 'act3_survival'
  | 'parkour_minigame'
  | 'plants_vs_roners';

type Act4WeaponId = 'pistol' | 'uzi' | 'ak47' | 'sniper' | 'rpg' | 'flamethrower';

interface CharacterCustomization {
  head: HeroPartOwner;
  hat: HeroPartOwner | 'none';
  torso: HeroPartOwner;
  wings: HeroPartOwner;
  legs: HeroPartOwner;
}

interface ServerPartyMember {
  id: string;
  secret: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  alive: boolean;
  customization: CharacterCustomization;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speedNorm: number;
  isAirborne: boolean;
  isDead: boolean;
  flashlightOn: boolean;
  activeWeapon: Act4WeaponId;
  ws: WebSocket | null;
  lastSeen: number;
}

interface ServerPartyRoom {
  code: string;
  hostId: string;
  mode: GameMode;
  hardcoreMode: boolean;
  voidMode: boolean;
  status: 'lobby' | 'playing';
  seed: number;
  members: Map<string, ServerPartyMember>;
  claimedKeys: Set<string>;
  createdAt: number;
  updatedAt: number;
}

const VALID_MODES: ReadonlySet<GameMode> = new Set([
  'story_act1',
  'story_act2',
  'story_act3',
  'story_act4',
  'first_person',
  'hardcore_third_person',
  'fnaf_epta',
  'sniper_minigame',
  'act3_survival',
  'parkour_minigame',
  'plants_vs_roners',
]);

const VALID_OWNERS: ReadonlySet<HeroPartOwner> = new Set(['nikita', 'roner', 'sasha']);
const VALID_WEAPONS: ReadonlySet<Act4WeaponId> = new Set([
  'pistol',
  'uzi',
  'ak47',
  'sniper',
  'rpg',
  'flamethrower',
]);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ROOMS = 500;
const MAX_MEMBERS_PER_ROOM = 8;

const rooms = new Map<string, ServerPartyRoom>();
const socketSession = new WeakMap<WebSocket, { roomCode: string; memberId: string }>();

function sanitizeNickname(raw: unknown): string {
  if (typeof raw !== 'string') return 'Player';
  const cleaned = raw.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 18);
  return cleaned.length > 0 ? cleaned : 'Player';
}

function sanitizeRoomCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

function sanitizeCustomization(raw: unknown): CharacterCustomization {
  if (!raw || typeof raw !== 'object') {
    return { head: 'nikita', hat: 'nikita', torso: 'nikita', wings: 'nikita', legs: 'nikita' };
  }
  const obj = raw as Record<string, unknown>;
  const pickOwner = (val: unknown, fallback: HeroPartOwner): HeroPartOwner =>
    typeof val === 'string' && VALID_OWNERS.has(val as HeroPartOwner)
      ? (val as HeroPartOwner)
      : fallback;

  return {
    head: pickOwner(obj.head, 'nikita'),
    hat: obj.hat === 'none' ? 'none' : pickOwner(obj.hat, 'nikita'),
    torso: pickOwner(obj.torso, 'nikita'),
    wings: pickOwner(obj.wings, 'nikita'),
    legs: pickOwner(obj.legs, 'nikita'),
  };
}

function generateRoomCode(): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    if (!rooms.has(code)) return code;
  }
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function serializeRoom(room: ServerPartyRoom) {
  return {
    code: room.code,
    hostId: room.hostId,
    mode: room.mode,
    hardcoreMode: room.hardcoreMode,
    voidMode: room.voidMode,
    status: room.status,
    seed: room.seed,
    members: Array.from(room.members.values()).map((m) => ({
      id: m.id,
      name: m.name,
      isHost: m.id === room.hostId,
      ready: m.ready,
      connected: m.connected,
      alive: m.alive,
      customization: m.customization,
      x: m.x,
      y: m.y,
      z: m.z,
      yaw: m.yaw,
      speedNorm: m.speedNorm,
      isAirborne: m.isAirborne,
      isDead: m.isDead,
      flashlightOn: m.flashlightOn,
      activeWeapon: m.activeWeapon,
    })),
  };
}

function sendJson(ws: WebSocket | null, payload: Record<string, unknown>): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function broadcastRoom(
  room: ServerPartyRoom,
  payload: Record<string, unknown>,
  excludeMemberId?: string
): void {
  const encoded = JSON.stringify(payload);
  for (const member of room.members.values()) {
    if (excludeMemberId && member.id === excludeMemberId) continue;
    if (member.ws && member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(encoded);
    }
  }
}

function broadcastPartyState(room: ServerPartyRoom): void {
  broadcastRoom(room, { type: 'party:state', room: serializeRoom(room) });
}

function removeMemberFromRoom(room: ServerPartyRoom, memberId: string): void {
  const member = room.members.get(memberId);
  if (!member) return;
  room.members.delete(memberId);
  room.updatedAt = Date.now();

  if (room.members.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === memberId) {
    const nextHost =
      Array.from(room.members.values()).find((m) => m.connected) ??
      Array.from(room.members.values())[0];
    if (nextHost) {
      room.hostId = nextHost.id;
      nextHost.isHost = true;
    }
  }
  broadcastPartyState(room);
}

function detachSocketFromPreviousSession(ws: WebSocket): void {
  const prev = socketSession.get(ws);
  if (!prev) return;
  socketSession.delete(ws);
  const prevRoom = rooms.get(prev.roomCode);
  if (!prevRoom) return;
  removeMemberFromRoom(prevRoom, prev.memberId);
}

function finiteOr(val: unknown, fallback: number, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.get('/api/party/check/:code', (req, res) => {
    const code = sanitizeRoomCode(req.params.code);
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false });
      return;
    }
    res.json({
      exists: true,
      code: room.code,
      memberCount: room.members.size,
      maxMembers: MAX_MEMBERS_PER_ROOM,
      mode: room.mode,
      status: room.status,
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 16 * 1024,
  });

  wss.on('connection', (ws) => {
    ws.on('message', (rawBuf) => {
      let msg: Record<string, unknown>;
      try {
        const parsed = JSON.parse(rawBuf.toString('utf8'));
        if (!parsed || typeof parsed !== 'object') return;
        msg = parsed as Record<string, unknown>;
      } catch {
        return;
      }

      const type = typeof msg.type === 'string' ? msg.type : '';

      if (type === 'party:create') {
        if (rooms.size >= MAX_ROOMS) {
          sendJson(ws, { type: 'party:error', code: 'SERVER_FULL' });
          return;
        }
        detachSocketFromPreviousSession(ws);

        const code = generateRoomCode();
        const memberId = crypto.randomUUID();
        const memberSecret = crypto.randomBytes(16).toString('hex');
        const mode: GameMode =
          typeof msg.mode === 'string' && VALID_MODES.has(msg.mode as GameMode)
            ? (msg.mode as GameMode)
            : 'story_act1';

        const hostMember: ServerPartyMember = {
          id: memberId,
          secret: memberSecret,
          name: sanitizeNickname(msg.name),
          isHost: true,
          ready: true,
          connected: true,
          alive: true,
          customization: sanitizeCustomization(msg.customization),
          x: 0,
          y: 0,
          z: 0,
          yaw: Math.PI,
          speedNorm: 0,
          isAirborne: false,
          isDead: false,
          flashlightOn: true,
          activeWeapon: 'pistol',
          ws,
          lastSeen: Date.now(),
        };

        const room: ServerPartyRoom = {
          code,
          hostId: memberId,
          mode,
          hardcoreMode: Boolean(msg.hardcoreMode),
          voidMode: Boolean(msg.voidMode),
          status: 'lobby',
          seed: crypto.randomInt(1, 2147483647),
          members: new Map([[memberId, hostMember]]),
          claimedKeys: new Set(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        rooms.set(code, room);
        socketSession.set(ws, { roomCode: code, memberId });

        sendJson(ws, {
          type: 'party:joined',
          memberId,
          memberSecret,
          room: serializeRoom(room),
        });
        return;
      }

      if (type === 'party:join') {
        const code = sanitizeRoomCode(msg.code);
        const room = rooms.get(code);
        if (!room) {
          sendJson(ws, { type: 'party:error', code: 'ROOM_NOT_FOUND' });
          return;
        }
        if (room.members.size >= MAX_MEMBERS_PER_ROOM) {
          sendJson(ws, { type: 'party:error', code: 'ROOM_FULL' });
          return;
        }
        detachSocketFromPreviousSession(ws);

        const memberId = crypto.randomUUID();
        const memberSecret = crypto.randomBytes(16).toString('hex');
        const member: ServerPartyMember = {
          id: memberId,
          secret: memberSecret,
          name: sanitizeNickname(msg.name),
          isHost: false,
          ready: true,
          connected: true,
          alive: room.status !== 'playing',
          customization: sanitizeCustomization(msg.customization),
          x: 0,
          y: 0,
          z: 0,
          yaw: Math.PI,
          speedNorm: 0,
          isAirborne: false,
          isDead: false,
          flashlightOn: true,
          activeWeapon: 'pistol',
          ws,
          lastSeen: Date.now(),
        };

        room.members.set(memberId, member);
        room.updatedAt = Date.now();
        socketSession.set(ws, { roomCode: code, memberId });

        sendJson(ws, {
          type: 'party:joined',
          memberId,
          memberSecret,
          room: serializeRoom(room),
        });
        broadcastPartyState(room);
        if (room.status === 'playing') {
          sendJson(ws, {
            type: 'party:launch',
            mode: room.mode,
            hardcoreMode: room.hardcoreMode,
            voidMode: room.voidMode,
            seed: room.seed,
            room: serializeRoom(room),
          });
        }
        return;
      }

      if (type === 'party:rejoin') {
        const code = sanitizeRoomCode(msg.code);
        const memberId = typeof msg.memberId === 'string' ? msg.memberId : '';
        const memberSecret = typeof msg.memberSecret === 'string' ? msg.memberSecret : '';
        const room = rooms.get(code);
        const member = room?.members.get(memberId);
        if (!room || !member || member.secret !== memberSecret) {
          sendJson(ws, { type: 'party:error', code: 'REJOIN_FAILED' });
          return;
        }
        member.ws = ws;
        member.connected = true;
        member.lastSeen = Date.now();
        socketSession.set(ws, { roomCode: code, memberId });
        sendJson(ws, {
          type: 'party:joined',
          memberId: member.id,
          memberSecret: member.secret,
          room: serializeRoom(room),
        });
        broadcastPartyState(room);
        return;
      }

      const session = socketSession.get(ws);
      if (!session) return;
      const room = rooms.get(session.roomCode);
      const member = room?.members.get(session.memberId);
      if (!room || !member) return;
      member.lastSeen = Date.now();
      room.updatedAt = Date.now();

      if (type === 'party:leave') {
        socketSession.delete(ws);
        removeMemberFromRoom(room, member.id);
        sendJson(ws, { type: 'party:left' });
        return;
      }

      if (type === 'party:update_profile') {
        if (msg.name !== undefined) {
          member.name = sanitizeNickname(msg.name);
        }
        if (msg.customization !== undefined) {
          member.customization = sanitizeCustomization(msg.customization);
        }
        broadcastPartyState(room);
        return;
      }

      if (type === 'party:toggle_ready') {
        member.ready = typeof msg.ready === 'boolean' ? msg.ready : !member.ready;
        broadcastPartyState(room);
        return;
      }

      if (type === 'party:select_mode') {
        if (member.id !== room.hostId) return;
        if (typeof msg.mode === 'string' && VALID_MODES.has(msg.mode as GameMode)) {
          room.mode = msg.mode as GameMode;
        }
        if (typeof msg.hardcoreMode === 'boolean') {
          room.hardcoreMode = msg.hardcoreMode;
        }
        if (typeof msg.voidMode === 'boolean') {
          room.voidMode = msg.voidMode;
        }
        broadcastPartyState(room);
        return;
      }

      if (type === 'party:launch') {
        if (member.id !== room.hostId) return;
        if (typeof msg.mode === 'string' && VALID_MODES.has(msg.mode as GameMode)) {
          room.mode = msg.mode as GameMode;
        }
        if (typeof msg.hardcoreMode === 'boolean') {
          room.hardcoreMode = msg.hardcoreMode;
        }
        if (typeof msg.voidMode === 'boolean') {
          room.voidMode = msg.voidMode;
        }
        room.status = 'playing';
        room.seed = crypto.randomInt(1, 2147483647);
        room.claimedKeys.clear();
        for (const m of room.members.values()) {
          m.alive = true;
          m.isDead = false;
        }
        broadcastPartyState(room);
        broadcastRoom(room, {
          type: 'party:launch',
          mode: room.mode,
          hardcoreMode: room.hardcoreMode,
          voidMode: room.voidMode,
          seed: room.seed,
          room: serializeRoom(room),
        });
        return;
      }

      if (type === 'party:return_lobby') {
        if (member.id !== room.hostId) return;
        room.status = 'lobby';
        room.claimedKeys.clear();
        for (const m of room.members.values()) {
          m.alive = true;
          m.isDead = false;
        }
        broadcastRoom(room, {
          type: 'party:return_lobby',
          room: serializeRoom(room),
        });
        return;
      }

      if (type === 'player:state') {
        member.x = finiteOr(msg.x, member.x, -2500, 2500);
        member.y = finiteOr(msg.y, member.y, -200, 500);
        member.z = finiteOr(msg.z, member.z, -2500, 2500);
        member.yaw = finiteOr(msg.yaw, member.yaw, -100, 100);
        member.speedNorm = finiteOr(msg.speedNorm, 0, 0, 5);
        member.isAirborne = Boolean(msg.isAirborne);
        member.isDead = Boolean(msg.isDead);
        member.flashlightOn = Boolean(msg.flashlightOn);
        if (typeof msg.alive === 'boolean') member.alive = msg.alive;
        if (typeof msg.activeWeapon === 'string' && VALID_WEAPONS.has(msg.activeWeapon as Act4WeaponId)) {
          member.activeWeapon = msg.activeWeapon as Act4WeaponId;
        }

        broadcastRoom(
          room,
          {
            type: 'player:state',
            memberId: member.id,
            x: member.x,
            y: member.y,
            z: member.z,
            yaw: member.yaw,
            speedNorm: member.speedNorm,
            isAirborne: member.isAirborne,
            isDead: member.isDead,
            flashlightOn: member.flashlightOn,
            alive: member.alive,
            activeWeapon: member.activeWeapon,
          },
          member.id
        );
        return;
      }

      if (type === 'game:event') {
        const eventType = typeof msg.eventType === 'string' ? msg.eventType.slice(0, 48) : '';
        if (!eventType) return;
        const payload =
          msg.payload && typeof msg.payload === 'object'
            ? (msg.payload as Record<string, unknown>)
            : {};

        if (eventType === 'collectible_claim') {
          const claimKey = typeof payload.key === 'string' ? payload.key.slice(0, 80) : '';
          if (!claimKey) return;
          if (room.claimedKeys.has(claimKey)) return; // Idempotent guard
          room.claimedKeys.add(claimKey);
        }

        if (eventType === 'player_downed') {
          member.alive = false;
          member.isDead = true;
          const anyAlive = Array.from(room.members.values()).some(
            (m) => m.connected && m.alive
          );
          if (!anyAlive) {
            broadcastRoom(room, {
              type: 'game:event',
              senderId: member.id,
              senderName: member.name,
              eventType: 'party_gameover',
              payload: {
                killerId: typeof payload.killerId === 'string' ? payload.killerId : 'roner',
                killerName:
                  typeof payload.killerName === 'string'
                    ? payload.killerName.slice(0, 40)
                    : 'RONER_552',
                hardcoreBurnout: Boolean(payload.hardcoreBurnout),
              },
            });
            return;
          }
        }

        if (eventType === 'player_revived') {
          member.alive = true;
          member.isDead = false;
        }

        broadcastRoom(
          room,
          {
            type: 'game:event',
            senderId: member.id,
            senderName: member.name,
            eventType,
            payload,
          },
          member.id
        );
      }
    });

    ws.on('close', () => {
      const session = socketSession.get(ws);
      if (!session) return;
      socketSession.delete(ws);
      const room = rooms.get(session.roomCode);
      const member = room?.members.get(session.memberId);
      if (!room || !member) return;
      member.connected = false;
      member.ws = null;
      member.lastSeen = Date.now();
      broadcastPartyState(room);

      // Give 20s reconnect grace before removing disconnected member
      setTimeout(() => {
        const currentRoom = rooms.get(session.roomCode);
        const currentMember = currentRoom?.members.get(session.memberId);
        if (currentRoom && currentMember && !currentMember.connected) {
          removeMemberFromRoom(currentRoom, currentMember.id);
        }
      }, 20_000);
    });
  });

  // Periodic cleanup for inactive rooms (2h)
  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
      if (room.updatedAt < cutoff) {
        rooms.delete(code);
      }
    }
  }, 5 * 60 * 1000).unref();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
