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
