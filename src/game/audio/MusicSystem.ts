import { MUSIC_CUES, midiToFrequency, type CueId, type CueVoice } from './score';

type AudioCtor = typeof AudioContext;

export interface MusicDebugState {
  supported: boolean;
  unlocked: boolean;
  enabled: boolean;
  desiredCueId: CueId | null;
  activeCueId: CueId | null;
}

export class MusicSystem {
  private readonly AudioContextCtor?: AudioCtor;

  private readonly supported: boolean;

  private context?: AudioContext;

  private masterGain?: GainNode;

  private schedulerHandle: ReturnType<typeof globalThis.setInterval> | null = null;

  private unlocked = false;

  private enabled = true;

  private desiredCueId: CueId | null = null;

  private activeCueId: CueId | null = null;

  private stepIndex = 0;

  private nextStepAt = 0;

  constructor() {
    this.AudioContextCtor = this.resolveAudioContext();
    this.supported = Boolean(this.AudioContextCtor);
  }

  sync(enabled: boolean, cueId: CueId | null): void {
    this.enabled = enabled;
    this.desiredCueId = cueId;
    this.applyState();
  }

  unlock(): void {
    if (!this.supported) {
      return;
    }

    this.unlocked = true;
    void this.ensureContext().then(() => {
      this.applyState();
    });
  }

  getState(): MusicDebugState {
    return {
      supported: this.supported,
      unlocked: this.unlocked,
      enabled: this.enabled,
      desiredCueId: this.desiredCueId,
      activeCueId: this.activeCueId,
    };
  }

  private applyState(): void {
    if (!this.supported) {
      return;
    }

    if (!this.enabled || !this.desiredCueId) {
      this.stopCue();
      return;
    }

    if (!this.unlocked) {
      return;
    }

    void this.startDesiredCue();
  }

  private async startDesiredCue(): Promise<void> {
    const context = await this.ensureContext();
    if (!context || !this.masterGain || !this.enabled || !this.desiredCueId) {
      return;
    }

    const cue = MUSIC_CUES[this.desiredCueId];
    if (this.activeCueId !== cue.id) {
      this.activeCueId = cue.id;
      this.stepIndex = 0;
      this.nextStepAt = context.currentTime + 0.08;
      this.restartScheduler();
    }

    this.masterGain.gain.cancelScheduledValues(context.currentTime);
    this.masterGain.gain.setTargetAtTime(cue.masterGain, context.currentTime, 0.35);
    this.tick();
  }

  private stopCue(): void {
    if (this.schedulerHandle !== null) {
      globalThis.clearInterval(this.schedulerHandle);
      this.schedulerHandle = null;
    }

    if (this.context && this.masterGain) {
      const at = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(at);
      this.masterGain.gain.setTargetAtTime(0.0001, at, 0.2);
    }

    this.activeCueId = null;
  }

  private restartScheduler(): void {
    if (this.schedulerHandle !== null) {
      globalThis.clearInterval(this.schedulerHandle);
    }

    this.schedulerHandle = globalThis.setInterval(() => {
      this.tick();
    }, 80);
  }

  private tick(): void {
    if (!this.context || !this.masterGain || !this.activeCueId || !this.enabled) {
      return;
    }

    const cue = MUSIC_CUES[this.activeCueId];
    const stepDuration = 60 / cue.tempo / cue.stepsPerBeat;
    const horizon = this.context.currentTime + 0.24;

    while (this.nextStepAt < horizon) {
      cue.voices.forEach((voice) => {
        const token = voice.pattern[this.stepIndex % voice.pattern.length];
        if (token === null) {
          return;
        }

        const [note, lengthInSteps] = Array.isArray(token) ? token : [token, 1];
        this.scheduleVoice(voice, note, this.nextStepAt, stepDuration * lengthInSteps);
      });

      this.stepIndex += 1;
      this.nextStepAt += stepDuration;
    }
  }

  private scheduleVoice(voice: CueVoice, note: number, startAt: number, duration: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    oscillator.type = voice.wave;
    oscillator.frequency.setValueAtTime(midiToFrequency(note), startAt);
    oscillator.detune.setValueAtTime(voice.detune ?? 0, startAt);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(voice.filter ?? 1200, startAt);
    filter.Q.setValueAtTime(0.0001, startAt);

    const peakAt = Math.min(startAt + voice.attack, startAt + duration * 0.45);
    const releaseAt = Math.max(peakAt + 0.03, startAt + duration * voice.sustain);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.linearRampToValueAtTime(voice.gain, peakAt);
    envelope.gain.exponentialRampToValueAtTime(0.0001, releaseAt);

    oscillator.connect(filter);
    filter.connect(envelope);

    let destination: AudioNode = this.masterGain;
    if ('createStereoPanner' in this.context) {
      const panner = this.context.createStereoPanner();
      panner.pan.setValueAtTime(voice.pan ?? 0, startAt);
      envelope.connect(panner);
      panner.connect(this.masterGain);
      destination = panner;
    } else {
      envelope.connect(this.masterGain);
    }

    void destination;
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }

  private async ensureContext(): Promise<AudioContext | undefined> {
    if (!this.AudioContextCtor) {
      return undefined;
    }

    if (!this.context) {
      this.context = new this.AudioContextCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === 'suspended') {
      await this.context.resume().catch(() => undefined);
    }

    return this.context;
  }

  private resolveAudioContext(): AudioCtor | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const webkitWindow = window as typeof window & {
      webkitAudioContext?: AudioCtor;
    };

    return window.AudioContext ?? webkitWindow.webkitAudioContext;
  }
}
