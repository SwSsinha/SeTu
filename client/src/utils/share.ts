export function buildShareMessage(audioUrl: string, opts?: { summary?: string }) {
  let base = 'Listen to this translated audio from SeTu:'
  if (opts?.summary) base += `\nSummary: ${opts.summary}\n`
  return `${base} ${audioUrl}`
}
