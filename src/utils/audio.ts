class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private playTone(freq: number, duration: number, type: OscillatorType, volume: number, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playAccepted(hasBonus: boolean) {
    this.playTone(523.25, 0.16, 'sine', 0.06, 0);
    this.playTone(659.25, 0.22, 'sine', 0.06, 0.07);
    if (hasBonus) {
      this.playTone(783.99, 0.24, 'triangle', 0.07, 0.14);
      this.playTone(1046.5, 0.34, 'triangle', 0.06, 0.21);
    }
  }

  playError() {
    this.playTone(210, 0.14, 'triangle', 0.05, 0);
    this.playTone(175, 0.18, 'triangle', 0.05, 0.08);
  }

  playTick() {
    this.playTone(880, 0.045, 'sine', 0.025, 0);
  }

  playTimeout() {
    this.playTone(311.13, 0.2, 'sawtooth', 0.035, 0);
    this.playTone(233.08, 0.35, 'sawtooth', 0.035, 0.15);
  }

  playVictory() {
    this.playTone(523.25, 0.18, 'sine', 0.06, 0);
    this.playTone(659.25, 0.18, 'sine', 0.06, 0.1);
    this.playTone(783.99, 0.2, 'sine', 0.06, 0.2);
    this.playTone(1046.5, 0.45, 'triangle', 0.07, 0.3);
  }
}

export const soundEngine = new SoundEngine();
