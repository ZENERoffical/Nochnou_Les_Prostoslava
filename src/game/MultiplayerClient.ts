import {
  Act4WeaponId,
  CharacterCustomization,
  GameMode,
  PartyRoomState,
} from '../types/game';

export interface RemotePlayerStateMsg {
  memberId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speedNorm: number;
  isAirborne: boolean;
  isDead: boolean;
  flashlightOn: boolean;
  alive: boolean;
  activeWeapon: Act4WeaponId;
}

export interface PartyLaunchMsg {
  mode: GameMode;
  hardcoreMode: boolean;
  voidMode: boolean;
  seed: number;
  room: PartyRoomState;
}

export interface GameEventMsg {
  senderId: string;
  senderName: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface MultiplayerClientCallbacks {
  onConnectionChange?: (connected: boolean) => void;
  onPartyState?: (room: PartyRoomState | null, myMemberId: string | null) => void;
  onPartyError?: (errorCode: string) => void;
  onLaunch?: (launch: PartyLaunchMsg) => void;
  onReturnLobby?: (room: PartyRoomState) => void;
  onRemotePlayerState?: (state: RemotePlayerStateMsg) => void;
  onGameEvent?: (event: GameEventMsg) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerClientCallbacks;
  private room: PartyRoomState | null = null;
  private myMemberId: string | null = null;
  private mySecret: string | null = null;
  private reconnectTimer: number | null = null;
  private pendingMessages: string[] = [];
  private manualClose = false;

  constructor(callbacks: MultiplayerClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(next: MultiplayerClientCallbacks): void {
    this.callbacks = { ...this.callbacks, ...next };
  }

  public getRoom(): PartyRoomState | null {
    return this.room;
  }

  public getMyMemberId(): string | null {
    return this.myMemberId;
  }

  public isInParty(): boolean {
    return this.room !== null;
  }

  public isHost(): boolean {
    return Boolean(this.room && this.myMemberId && this.room.hostId === this.myMemberId);
  }

  public ensureConnected(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.manualClose = false;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.callbacks.onConnectionChange?.(true);
      if (this.room && this.myMemberId && this.mySecret) {
        ws.send(
          JSON.stringify({
            type: 'party:rejoin',
            code: this.room.code,
            memberId: this.myMemberId,
            memberSecret: this.mySecret,
          })
        );
      }
      while (this.pendingMessages.length > 0 && ws.readyState === WebSocket.OPEN) {
        const next = this.pendingMessages.shift();
        if (next) ws.send(next);
      }
    };

    ws.onmessage = (evt) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(evt.data)) as Record<string, unknown>;
      } catch {
        return;
      }
      const type = typeof msg.type === 'string' ? msg.type : '';

      if (type === 'party:joined') {
        this.myMemberId = typeof msg.memberId === 'string' ? msg.memberId : null;
        this.mySecret = typeof msg.memberSecret === 'string' ? msg.memberSecret : null;
        this.room = (msg.room as PartyRoomState) ?? null;
        this.callbacks.onPartyState?.(this.room, this.myMemberId);
        return;
      }

      if (type === 'party:state') {
        this.room = (msg.room as PartyRoomState) ?? null;
        this.callbacks.onPartyState?.(this.room, this.myMemberId);
        return;
      }

      if (type === 'party:left') {
        this.room = null;
        this.myMemberId = null;
        this.mySecret = null;
        this.callbacks.onPartyState?.(null, null);
        return;
      }

      if (type === 'party:error') {
        const code = typeof msg.code === 'string' ? msg.code : 'UNKNOWN_ERROR';
        if (code === 'REJOIN_FAILED') {
          this.room = null;
          this.myMemberId = null;
          this.mySecret = null;
          this.callbacks.onPartyState?.(null, null);
        }
        this.callbacks.onPartyError?.(code);
        return;
      }

      if (type === 'party:launch') {
        const launch = msg as unknown as PartyLaunchMsg;
        if (launch.room) {
          this.room = launch.room;
          this.callbacks.onPartyState?.(this.room, this.myMemberId);
        }
        this.callbacks.onLaunch?.(launch);
        return;
      }

      if (type === 'party:return_lobby') {
        const room = (msg.room as PartyRoomState) ?? null;
        if (room) {
          this.room = room;
          this.callbacks.onPartyState?.(this.room, this.myMemberId);
          this.callbacks.onReturnLobby?.(room);
        }
        return;
      }

      if (type === 'player:state') {
        this.callbacks.onRemotePlayerState?.(msg as unknown as RemotePlayerStateMsg);
        return;
      }

      if (type === 'game:event') {
        this.callbacks.onGameEvent?.(msg as unknown as GameEventMsg);
      }
    };

    ws.onclose = () => {
      this.callbacks.onConnectionChange?.(false);
      this.ws = null;
      if (!this.manualClose && this.room && this.myMemberId && this.mySecret) {
        if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = window.setTimeout(() => {
          this.ensureConnected();
        }, 1200);
      }
    };
  }

  private send(payload: Record<string, unknown>, queueIfConnecting = true): void {
    this.ensureConnected();
    const encoded = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(encoded);
    } else if (queueIfConnecting && this.pendingMessages.length < 32) {
      this.pendingMessages.push(encoded);
    }
  }

  public createParty(
    name: string,
    customization: CharacterCustomization,
    mode: GameMode,
    hardcoreMode: boolean,
    voidMode: boolean
  ): void {
    this.send({
      type: 'party:create',
      name,
      customization,
      mode,
      hardcoreMode,
      voidMode,
    });
  }

  public joinParty(
    code: string,
    name: string,
    customization: CharacterCustomization
  ): void {
    this.send({
      type: 'party:join',
      code,
      name,
      customization,
    });
  }

  public leaveParty(): void {
    if (!this.room) return;
    this.send({ type: 'party:leave' }, false);
    this.room = null;
    this.myMemberId = null;
    this.mySecret = null;
    this.callbacks.onPartyState?.(null, null);
  }

  public updateProfile(name: string, customization: CharacterCustomization): void {
    if (!this.room) return;
    this.send({ type: 'party:update_profile', name, customization });
  }

  public toggleReady(ready?: boolean): void {
    if (!this.room) return;
    this.send({ type: 'party:toggle_ready', ready });
  }

  public selectMode(mode: GameMode, hardcoreMode: boolean, voidMode: boolean): void {
    if (!this.isHost()) return;
    this.send({ type: 'party:select_mode', mode, hardcoreMode, voidMode });
  }

  public launchParty(mode: GameMode, hardcoreMode: boolean, voidMode: boolean): void {
    if (!this.isHost()) return;
    this.send({ type: 'party:launch', mode, hardcoreMode, voidMode });
  }

  public returnToLobby(): void {
    if (!this.isHost()) return;
    this.send({ type: 'party:return_lobby' });
  }

  public sendPlayerState(state: Omit<RemotePlayerStateMsg, 'memberId'>): void {
    if (!this.room || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'player:state', ...state }));
  }

  public sendGameEvent(eventType: string, payload: Record<string, unknown> = {}): void {
    if (!this.room) return;
    this.send({ type: 'game:event', eventType, payload });
  }

  public dispose(): void {
    this.manualClose = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
