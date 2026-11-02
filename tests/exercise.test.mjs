import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cueAt } from '../frontend/exercise.mjs';

const skill = JSON.parse(readFileSync(new URL('../frontend/skill.json', import.meta.url)));

test('four-second inhale, six-second exhale at every cycle boundary', () => {
  for (let cycle = 0; cycle < 6; cycle++) {
    const offset = cycle * 10000;
    assert.equal(cueAt(offset, skill).phase, 'Inhale');
    assert.equal(cueAt(offset + 3999, skill).phase, 'Inhale');
    assert.equal(cueAt(offset + 4000, skill).phase, 'Exhale');
    assert.equal(cueAt(offset + 9999, skill).phase, 'Exhale');
    assert.equal(cueAt(offset, skill).cycle, cycle + 1);
  }
});

test('completion uses elapsed time even after delayed frames', () => {
  assert.equal(cueAt(59999, skill).complete, false);
  assert.equal(cueAt(60000, skill).complete, true);
  assert.equal(cueAt(61234, skill).complete, true);
  assert.equal(cueAt(61234, skill).remaining, 0);
  assert.equal(cueAt(61234, skill).progress, 100);
});
