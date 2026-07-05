// Runs async functions that share the same key one at a time.
const tails = new Map();

export function withLock(key, fn) {
  const prev = tails.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  const next = run.catch(() => {});
  tails.set(key, next);
  next.finally(() => {
    if (tails.get(key) === next) tails.delete(key);
  });
  return run;
}
