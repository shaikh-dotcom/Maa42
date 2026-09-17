// Web Audio API ambient relaxation synthesizer for guided care audio
class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private gainNode: GainNode | null = null;
  private oscs: OscillatorNode[] = [];

  public start(frequency = 174) {
    try {
      if (this.isPlaying) this.stop();

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(
        0.12,
        this.ctx.currentTime + 2,
      );
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

    // Capture this specific context/oscillators/gain locally before doing
    // anything async. If start() is called again before the fade-out
    // below finishes, `this.ctx` / `this.oscs` will already point at a
    // NEW context — but this closure only ever touches the OLD one, so
    // the two can no longer collide.
    const ctxToClose = this.ctx;
    const oscsToStop = this.oscs;
    const gain = this.gainNode;

    // Reset instance state immediately (not after the timeout) so a rapid
    // stop -> start -> stop sequence can never see stale isPlaying/ctx
    // state and so a second click on "stop" is a safe no-op instead of
    // scheduling a second overlapping cleanup.
    this.ctx = null;
    this.oscs = [];
    this.gainNode = null;
    this.isPlaying = false;

    try {
      if (gain) {
        // Cancel any in-flight ramp (e.g. the fade-in) before scheduling
        // the fade-out, so the two automations can't fight each other.
        gain.gain.cancelScheduledValues(ctxToClose.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctxToClose.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctxToClose.currentTime + 0.8,
        );
      }
      setTimeout(() => {
        oscsToStop.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        if (ctxToClose.state !== "closed") {
          ctxToClose.close();
        }
      }, 800);
    } catch (e) {
      // Already stopped/closed — nothing left to do.
    }
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const soundEngine = new AmbientAudioEngine();
