// Central endpoint constants
export const ENDPOINTS = {
  PROCESS: '/api/process',
  PROCESS_TIMELINE: '/api/process/timeline',
  PROCESS_MULTI: '/api/process-multi',
  PROCESS_BUNDLE: '/api/process-bundle',
  RESULT: (id) => `/api/result/${id}`,
  RESULT_AUDIO: (id) => `/api/result/${id}/audio`,
  HISTORY: '/api/history',
  METRICS: '/api/metrics-lite',
  VOICES: '/api/voices',
};
