import { describe, expect, it } from 'vitest';
import { MUSIC_CUES, midiToFrequency, pickCueId } from '../../src/game/audio/score';

describe('music score', () => {
  it('maps app state to appropriate cues', () => {
    expect(pickCueId('title')).toBe('title');
    expect(pickCueId('world', 'harbor')).toBe('pilgrimage');
    expect(pickCueId('world', 'city')).toBe('pilgrimage');
    expect(pickCueId('world', 'storm')).toBe('storm');
    expect(pickCueId('world', 'fish')).toBe('depths');
    expect(pickCueId('world', 'desert')).toBe('wilderness');
    expect(pickCueId('world', 'hillside')).toBe('wilderness');
  });

  it('defines playable cues with voices and steps', () => {
    Object.values(MUSIC_CUES).forEach((cue) => {
      expect(cue.tempo).toBeGreaterThan(0);
      expect(cue.stepsPerBeat).toBeGreaterThan(0);
      expect(cue.voices.length).toBeGreaterThan(1);
      cue.voices.forEach((voice) => {
        expect(voice.pattern.length).toBeGreaterThan(0);
        expect(voice.gain).toBeGreaterThan(0);
      });
    });
  });

  it('converts midi notes to frequencies', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
    expect(midiToFrequency(57)).toBeCloseTo(220, 5);
  });
});
