import { transliterateEnglishToRussianPhonetics } from './localization';

export class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastSpeechAt = 0;

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech synthesis errors in restricted environments
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public playCensorBeep(delay = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.setValueAtTime(0.14, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playPickup(isGolden = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = isGolden ? [523.25, 659.25, 783.99, 1046.5] : [440, 660];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isGolden ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      osc.frequency.exponentialRampToValueAtTime(f * 1.18, now + idx * 0.06 + 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(isGolden ? 0.18 : 0.14, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.24);
    });
  }

  public playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playFootstep(sprint = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(sprint ? 105 : 85, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.07);
    gain.gain.setValueAtTime(sprint ? 0.055 : 0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playChaserEmerge(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [130.81, 196.0, 261.63].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.09, now + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.46);
    });
  }

  public playTaunt(phrase: string, pitch = 1.0, interrupt = false): void {
    const ctx = this.ensureContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(330 * pitch, now);
      osc.frequency.setValueAtTime(440 * pitch, now + 0.07);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    }

    this.speakRussian(phrase, pitch, 1.08, interrupt);
  }

  public playFlashlightClick(on: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(on ? 920 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(on ? 1280 : 320, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playKrysaRetreat(
    pitch = 1.0,
    speechText = 'Ля ты крыса!',
    hasCensorBeep = false
  ): void {
    const ctx = this.ensureContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(210 * pitch, now + 0.25);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.29);
    }
    if (hasCensorBeep) {
      this.playCensorBeep(0.24);
    }
    this.speakRussian(speechText, pitch * 1.05, 1.12, true);
  }

  public playCaughtScream(speechText = 'Я ХОЧУ БЫТЬ КАК ГАЗАН!'): void {
    const ctx = this.ensureContext();
    if (ctx) {
      const now = ctx.currentTime;
      // Heavy impact + dramatic rising siren scream
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(36, now + 0.7);
      subGain.gain.setValueAtTime(0.28, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.76);

      const siren = ctx.createOscillator();
      const sirenGain = ctx.createGain();
      siren.type = 'sawtooth';
      siren.frequency.setValueAtTime(380, now);
      siren.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      siren.frequency.exponentialRampToValueAtTime(620, now + 0.9);
      sirenGain.gain.setValueAtTime(0.16, now);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      siren.connect(sirenGain);
      sirenGain.connect(ctx.destination);
      siren.start(now);
      siren.stop(now + 0.96);
    }

    this.speakRussian(speechText, 1.3, 1.16, true);
  }

  public playBatteryPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 495, 660, 990].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.045);
      gain.gain.setValueAtTime(0.09, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.15);
    });
  }

  public playVictoryFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.1);
      gain.gain.setValueAtTime(0.14, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.46);
    });
  }

  public playBoxPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [310, 465, 620].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.11, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  public playPlaceSachet(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playTrayDrop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.09, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.17);
    });
  }

  public playBrickReturn(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playPackStamp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(48, now + 0.22);
    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.25);

    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(784, now + 0.1);
    chime.frequency.exponentialRampToValueAtTime(1174, now + 0.26);
    chimeGain.gain.setValueAtTime(0.12, now + 0.1);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.1);
    chime.stop(now + 0.31);
  }

  public playLockerToggle(enter: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(enter ? 240 : 160, now);
    osc.frequency.exponentialRampToValueAtTime(enter ? 95 : 220, now + 0.14);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playLightFlicker(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.setValueAtTime(60, now + 0.04);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playWindowBang(broken = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = broken ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(broken ? 680 : 145, now);
    osc.frequency.exponentialRampToValueAtTime(broken ? 95 : 52, now + (broken ? 0.32 : 0.16));
    gain.gain.setValueAtTime(broken ? 0.2 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (broken ? 0.34 : 0.18));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (broken ? 0.35 : 0.19));

    if (broken) {
      [1480, 1960, 2420].forEach((freq, idx) => {
        const shard = ctx.createOscillator();
        const sg = ctx.createGain();
        shard.type = 'square';
        shard.frequency.setValueAtTime(freq, now + idx * 0.035);
        shard.frequency.exponentialRampToValueAtTime(freq * 0.65, now + idx * 0.035 + 0.12);
        sg.gain.setValueAtTime(0.06, now + idx * 0.035);
        sg.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.14);
        shard.connect(sg);
        sg.connect(ctx.destination);
        shard.start(now + idx * 0.035);
        shard.stop(now + idx * 0.035 + 0.15);
      });
    }
  }

  public playFactoryAlarmTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(760, now + 0.24);
    osc.frequency.linearRampToValueAtTime(480, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playKeyUnlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66, 1567.98].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  public playDoorCreak(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.28);
    osc.frequency.linearRampToValueAtTime(110, now + 0.52);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.57);
  }

  public playSniperShot(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Heavy rifle boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(280, now);
    boom.frequency.exponentialRampToValueAtTime(34, now + 0.42);
    boomGain.gain.setValueAtTime(0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.46);

    // High-velocity crack + double MLG headshot hitmarker dings
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(1950, now);
    crack.frequency.exponentialRampToValueAtTime(260, now + 0.14);
    crackGain.gain.setValueAtTime(0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.16);

    [1680, 1980].forEach((freq, idx) => {
      const ding = ctx.createOscillator();
      const dg = ctx.createGain();
      ding.type = 'sine';
      ding.frequency.setValueAtTime(freq, now + 0.12 + idx * 0.12);
      dg.gain.setValueAtTime(0.16, now + 0.12 + idx * 0.12);
      dg.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + idx * 0.12);
      ding.connect(dg);
      dg.connect(ctx.destination);
      ding.start(now + 0.12 + idx * 0.12);
      ding.stop(now + 0.26 + idx * 0.12);
    });
  }

  public playAchievementUnlock(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playPlayerHit(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playFireLight(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    [220, 330, 495, 660].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + idx * 0.045 + 0.25);
      gain.gain.setValueAtTime(0.001, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.045 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.29);
    });
  }

  public playCrusherGrind(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.12);
    osc.frequency.linearRampToValueAtTime(175, now + 0.24);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  public playBaseUpgrade(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  public playBedSleep(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    // Soft dreamy lullaby descending + warm dawn chime
    [523.25, 440.0, 349.23, 587.33].forEach((freq, idx) => {
      const t = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  public playNightHorn(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    [98.0, 146.83].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.92, now + 0.55);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  public playExplosion(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Deep sub-bass detonation
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.1);
    subGain.gain.setValueAtTime(0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 1.25);

    // Filtered noise blast
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 1.1);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 1.0);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  public playDialogueLine(
    text: string,
    pitch = 1.0,
    hasCensorBeep = false
  ): void {
    const ctx = this.ensureContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(360 * pitch, now + 0.09);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }
    if (hasCensorBeep) {
      this.playCensorBeep(0.22);
    }
    this.speakRussian(text, pitch, 1.0, true);
  }

  public stopSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  private getRussianVoice(): SpeechSynthesisVoice | null {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      return (
        voices.find((v) => v.lang.toLowerCase() === 'ru-ru') ??
        voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ??
        null
      );
    } catch {
      return null;
    }
  }

  private speakRussian(
    text: string,
    pitch = 1.0,
    rate = 1.04,
    interrupt = false
  ): void {
    if (
      this.muted ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }
    try {
      const now = performance.now();
      if (interrupt) {
        window.speechSynthesis.cancel();
      } else if (window.speechSynthesis.speaking) {
        if (now - this.lastSpeechAt < 1100) {
          return;
        }
        window.speechSynthesis.cancel();
      }
      this.lastSpeechAt = now;

      const phoneticText = transliterateEnglishToRussianPhonetics(text);
      const utter = new SpeechSynthesisUtterance(phoneticText);
      const ruVoice = this.getRussianVoice();
      if (ruVoice) {
        utter.voice = ruVoice;
      }
      utter.lang = 'ru-RU';
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = 0.9;
      window.speechSynthesis.speak(utter);
    } catch {
      // SpeechSynthesis may be unsupported or blocked in automated environments
    }
  }

  public dispose(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
