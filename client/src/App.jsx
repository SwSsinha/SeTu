import { useState } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('https://example.com')
  const [lang, setLang] = useState('hi')
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAudioUrl(null)
    try {
      const res = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, lang })
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed: ${res.status}`)
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setAudioUrl(objectUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2>SeTu – quick test UI</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Article URL
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>
        <label>
          Language code
          <input
            type="text"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            placeholder="hi"
            style={{ width: '8rem', padding: '0.5rem' }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem' }}>
          {loading ? 'Processing…' : 'Translate & Generate Audio'}
        </button>
      </form>

      {error && (
        <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap', marginTop: '1rem' }}>{error}</pre>
      )}

      {audioUrl && (
        <div style={{ marginTop: '1rem' }}>
          <audio controls src={audioUrl} />
          <div style={{ marginTop: '0.5rem' }}>
            <a href={audioUrl} download={`setu_${lang}.mp3`}>Download MP3</a>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
