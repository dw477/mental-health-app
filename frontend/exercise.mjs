// Derive each cue from elapsed time so delayed frames do not accumulate drift.
export function cueAt(elapsedMs, skill) {
  const total = skill.duration_seconds * 1000;
  const cycleMs = (skill.inhale_seconds + skill.exhale_seconds) * 1000;
  const position = Math.max(0, elapsedMs) % cycleMs;
  const inhale = position < skill.inhale_seconds * 1000;
  return {
    complete: elapsedMs >= total,
    phase: inhale ? 'Inhale' : 'Exhale',
    phaseSeconds: Math.ceil(((inhale ? skill.inhale_seconds * 1000 : cycleMs) - position) / 1000),
    cycle: Math.min(skill.cycles, Math.floor(Math.max(0, elapsedMs) / cycleMs) + 1),
    remaining: Math.max(0, Math.ceil((total - elapsedMs) / 1000)),
    progress: Math.min(100, Math.max(0, elapsedMs / total * 100)),
  };
}
