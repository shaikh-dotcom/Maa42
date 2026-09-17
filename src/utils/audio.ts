// Web Audio API ambient relaxation synthesizer for guided care audio
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private gainNode: GainNode | null = null;
  private oscs: OscillatorNode[] = [];

  public start(frequency = 174) {
    try {
      if (this.isPlaying) this.stop();
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2);
      this.gainNode.connect(this.ctx.destination);

      // Warm harmonic chords (e.g., 174Hz healing tone, 261Hz, 348Hz, 432Hz)
      const freqs = [frequency, frequency * 1.5, frequency * 2];
      this.oscs = freqs.map((f) => {
        const osc = this.ctx!.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime);
        osc.connect(this.gainNode!);
        osc.start();
        return osc;
      });

      this.isPlaying = true;
    } catch (e) {
      console.warn("Web Audio not permitted or failed to start", e);
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      }
      setTimeout(() => {
        this.oscs.forEach((osc) => {
          try { osc.stop(); osc.disconnect(); } catch {}
        });
        this.oscs = [];
        if (this.ctx && this.ctx.state !== 'closed') {
          this.ctx.close();
        }
        this.ctx = null;
        this.isPlaying = false;
      }, 800);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const soundEngine = new AmbientAudioEngine();
