// Simple phase tracker for instrumentation of the processing pipeline
// Usage:
// const tracker = createPhaseTracker(runId)
// const p = tracker.start('scrape'); ... tracker.end(p, { meta })

function now() {
  return Date.now();
}

function createPhaseTracker(runId) {
  const phases = [];
  const startedAt = now();

  function start(name) {
    const phase = { name, status: 'running', startedAt: now() };
    phases.push(phase);
    return phase;
  }

  function end(phase, extra = {}) {
    if (!phase.finishedAt) {
      phase.finishedAt = now();
      phase.ms = phase.finishedAt - phase.startedAt;
    }
    Object.assign(phase, extra);
    return phase;
  }

  function succeed(phase, meta) {
    return end(phase, { status: 'success', ...(meta ? { meta } : {}) });
  }

  function fail(phase, error) {
    return end(phase, { status: 'error', error: error?.message || String(error) });
  }

  function summary() {
    const finishedAt = now();
    return {
      runId,
      startedAt,
      finishedAt,
      totalMs: finishedAt - startedAt,
      phases,
    };
  }

  return { start, succeed, fail, summary };
}

module.exports = { createPhaseTracker };
