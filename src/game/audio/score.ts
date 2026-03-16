export type CueId = 'title' | 'pilgrimage' | 'storm' | 'depths' | 'wilderness';
export type ThemeId = 'harbor' | 'storm' | 'fish' | 'desert' | 'gate' | 'city' | 'hillside';
export type PatternStep = number | [number, number] | null;

export interface CueVoice {
  wave: OscillatorType;
  pattern: PatternStep[];
  gain: number;
  attack: number;
  sustain: number;
  pan?: number;
  detune?: number;
  filter?: number;
}

export interface MusicCue {
  id: CueId;
  tempo: number;
  stepsPerBeat: number;
  masterGain: number;
  voices: CueVoice[];
}

const hold = (note: number, steps: number): [number, number] => [note, steps];

export function midiToFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export function pickCueId(mode: 'title' | 'world', theme?: string): CueId {
  if (mode === 'title') {
    return 'title';
  }

  switch (theme as ThemeId | undefined) {
    case 'storm':
      return 'storm';
    case 'fish':
      return 'depths';
    case 'desert':
    case 'hillside':
      return 'wilderness';
    default:
      return 'pilgrimage';
  }
}

export const MUSIC_CUES: Record<CueId, MusicCue> = {
  title: {
    id: 'title',
    tempo: 76,
    stepsPerBeat: 2,
    masterGain: 0.05,
    voices: [
      {
        wave: 'triangle',
        gain: 0.24,
        attack: 0.05,
        sustain: 0.96,
        pan: -0.2,
        filter: 980,
        pattern: [
          hold(38, 2), null, hold(45, 2), null, hold(41, 2), null, hold(43, 2), null,
          hold(38, 2), null, hold(45, 2), null, hold(48, 2), null, hold(45, 2), null,
        ],
      },
      {
        wave: 'sine',
        gain: 0.12,
        attack: 0.18,
        sustain: 0.98,
        pan: 0.15,
        filter: 760,
        pattern: [
          hold(50, 4), null, null, null, hold(53, 4), null, null, null,
          hold(57, 4), null, null, null, hold(55, 4), null, null, null,
        ],
      },
      {
        wave: 'square',
        gain: 0.05,
        attack: 0.02,
        sustain: 0.82,
        pan: 0.28,
        detune: 2,
        filter: 1600,
        pattern: [
          62, 64, hold(65, 2), null, 69, 67, hold(65, 2), null,
          64, 62, hold(60, 2), null, 62, 64, hold(67, 2), null,
        ],
      },
    ],
  },
  pilgrimage: {
    id: 'pilgrimage',
    tempo: 88,
    stepsPerBeat: 2,
    masterGain: 0.047,
    voices: [
      {
        wave: 'triangle',
        gain: 0.22,
        attack: 0.03,
        sustain: 0.9,
        pan: -0.18,
        filter: 1100,
        pattern: [
          hold(38, 2), null, hold(38, 2), null, hold(43, 2), null, hold(45, 2), null,
          hold(38, 2), null, hold(38, 2), null, hold(48, 2), null, hold(45, 2), null,
        ],
      },
      {
        wave: 'sine',
        gain: 0.11,
        attack: 0.12,
        sustain: 0.95,
        pan: 0.08,
        filter: 900,
        pattern: [
          hold(50, 4), null, null, null, hold(55, 4), null, null, null,
          hold(57, 4), null, null, null, hold(53, 4), null, null, null,
        ],
      },
      {
        wave: 'square',
        gain: 0.045,
        attack: 0.015,
        sustain: 0.78,
        pan: 0.24,
        detune: -3,
        filter: 1750,
        pattern: [
          62, null, 64, 65, 67, null, hold(69, 2), null,
          67, null, 65, 64, 62, null, hold(64, 2), null,
        ],
      },
    ],
  },
  storm: {
    id: 'storm',
    tempo: 92,
    stepsPerBeat: 2,
    masterGain: 0.044,
    voices: [
      {
        wave: 'triangle',
        gain: 0.22,
        attack: 0.02,
        sustain: 0.82,
        pan: -0.12,
        filter: 760,
        pattern: [
          hold(40, 1), hold(40, 1), hold(47, 1), hold(47, 1), hold(43, 1), hold(43, 1), hold(45, 1), hold(45, 1),
          hold(40, 1), hold(40, 1), hold(47, 1), hold(47, 1), hold(38, 1), hold(38, 1), hold(45, 1), hold(45, 1),
        ],
      },
      {
        wave: 'sine',
        gain: 0.095,
        attack: 0.08,
        sustain: 0.96,
        pan: 0.16,
        filter: 640,
        pattern: [
          hold(52, 4), null, null, null, hold(50, 4), null, null, null,
          hold(47, 4), null, null, null, hold(45, 4), null, null, null,
        ],
      },
      {
        wave: 'square',
        gain: 0.04,
        attack: 0.01,
        sustain: 0.7,
        pan: 0.22,
        detune: 6,
        filter: 1450,
        pattern: [
          64, null, 62, null, 60, null, 59, null,
          57, null, 59, null, 60, null, 62, null,
        ],
      },
    ],
  },
  depths: {
    id: 'depths',
    tempo: 68,
    stepsPerBeat: 2,
    masterGain: 0.043,
    voices: [
      {
        wave: 'triangle',
        gain: 0.18,
        attack: 0.06,
        sustain: 0.98,
        pan: -0.14,
        filter: 700,
        pattern: [
          hold(36, 4), null, null, null, hold(39, 4), null, null, null,
          hold(41, 4), null, null, null, hold(34, 4), null, null, null,
        ],
      },
      {
        wave: 'sine',
        gain: 0.11,
        attack: 0.22,
        sustain: 0.99,
        pan: 0.18,
        filter: 540,
        pattern: [
          hold(48, 8), null, null, null, null, null, null, null,
          hold(46, 8), null, null, null, null, null, null, null,
        ],
      },
      {
        wave: 'square',
        gain: 0.034,
        attack: 0.02,
        sustain: 0.76,
        pan: 0.12,
        detune: -8,
        filter: 1180,
        pattern: [
          null, 60, null, 58, null, 55, null, 58,
          null, 60, null, 63, null, 60, null, 58,
        ],
      },
    ],
  },
  wilderness: {
    id: 'wilderness',
    tempo: 72,
    stepsPerBeat: 2,
    masterGain: 0.041,
    voices: [
      {
        wave: 'triangle',
        gain: 0.19,
        attack: 0.04,
        sustain: 0.92,
        pan: -0.16,
        filter: 900,
        pattern: [
          hold(38, 2), null, hold(45, 2), null, hold(41, 2), null, hold(45, 2), null,
          hold(38, 2), null, hold(45, 2), null, hold(43, 2), null, hold(45, 2), null,
        ],
      },
      {
        wave: 'sine',
        gain: 0.095,
        attack: 0.16,
        sustain: 0.97,
        pan: 0.1,
        filter: 720,
        pattern: [
          hold(50, 4), null, null, null, hold(53, 4), null, null, null,
          hold(48, 4), null, null, null, hold(50, 4), null, null, null,
        ],
      },
      {
        wave: 'square',
        gain: 0.035,
        attack: 0.02,
        sustain: 0.74,
        pan: 0.2,
        filter: 1500,
        pattern: [
          62, null, 64, null, 65, null, 64, null,
          62, null, 60, null, 62, null, 57, null,
        ],
      },
    ],
  },
};
