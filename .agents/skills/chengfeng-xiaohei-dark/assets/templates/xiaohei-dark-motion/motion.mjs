/** Original deterministic example timing. Replace triggers with measured narration cues for production. */
export const FPS = 30;
export const DURATION = 10;
export const triggers = Object.freeze({occasional: 36, busy: 96, conclusion: 267});
export const clamp = value => Math.max(0, Math.min(1, value));
export const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export function actionAt(frame, trigger, continuous) {
  const elapsed = frame - trigger;
  const walk = ease(elapsed / 16);
  const settle = ease((elapsed - 22) / 12);
  const loadAt = trigger + 20;
  const arrivalAt = loadAt + 28;
  const responseEnd = continuous ? Infinity : arrivalAt + 38;
  const activeFrames = Math.max(0, Math.min(frame, responseEnd) - arrivalAt);
  return {workerX: 220 + 24 * walk - 6 * settle, reach: walk * (1 - .3 * settle),
    carry: elapsed < 20, pressed: elapsed >= 16,
    active: frame >= arrivalAt && frame < responseEnd,
    angle: activeFrames * (continuous ? 5 : 3.6), beltOffset: activeFrames * 2.1,
    loadAt, arrivalAt, firstOutputAt: arrivalAt + 28,
    stepping: Math.max(0, Math.sin(clamp(elapsed / 20) * Math.PI)) * .65};
}
export function packetsAt(frame, loadAt, continuous) {
  const count = continuous ? Math.max(0, Math.floor((frame - loadAt) / 18) + 1) : 1;
  const packets = [];
  // Only packets still visible are materialized. Long seeks do not create thousands of nodes.
  const first = continuous ? Math.max(0, count - 7) : 0;
  for (let id = first; id < count; id++) {
    const age = frame - loadAt - id * 18;
    if (age >= 0 && age < 28) packets.push({id, output: false, x: -103 + age / 28 * 103, y: 83 + ease(age / 7) * 36});
    if (age >= 56 && age < 100) packets.push({id, output: true, x: 400 + (age - 56) / 44 * 140, y: 119});
  }
  return packets;
}
export function sceneAt(seconds) {
  const time = Math.max(0, Math.min(DURATION, Number.isFinite(seconds) ? seconds : 0));
  const frame = Math.floor(time * FPS + 1e-6);
  const top = actionAt(frame, triggers.occasional, false);
  const bottom = actionAt(frame, triggers.busy, true);
  return {time, frame, top, bottom,
    topPackets: packetsAt(frame, top.loadAt, false),
    bottomPackets: packetsAt(frame, bottom.loadAt, true),
    topLabel: ease((frame - top.arrivalAt - 12) / 12),
    bottomLabel: ease((frame - bottom.arrivalAt - 12) / 16),
    finish: ease((frame - triggers.conclusion) / 18)};
}
