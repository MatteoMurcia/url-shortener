import { useRef, useState } from 'react';

export function CreateLinkForm() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    setShortUrl('');
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error?.message === 'string' ? data.error.message : 'Could not save your link. Please try again.');
      } else if (response.status === 201 && typeof data.shortUrl === 'string') {
        setShortUrl(data.shortUrl);
      } else {
        setError('The server returned an unexpected response.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="example" aria-labelledby="create-title">
      <p className="example-label">YOUR NEXT LINK</p>
      <h2 id="create-title">Make it short.</h2>
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} aria-busy={saving}>
        <label className="field-label" htmlFor="destination">Destination URL</label>
        <input
          id="destination" type="url" required maxLength={2048} value={url}
          placeholder="https://example.com/something-great" disabled={saving}
          aria-describedby="url-hint link-error" aria-invalid={error ? true : undefined}
          onChange={(event) => { setUrl(event.target.value); setShortUrl(''); setError(''); }}
        />
        <p id="url-hint" className="field-hint">An HTTP or HTTPS address, up to 2,048 characters.</p>
        <button type="submit" disabled={saving}>{saving ? 'Saving your link…' : 'Create short link'} <span aria-hidden="true">↗</span></button>
        <p id="link-error" className="form-error" role="alert">{error}</p>
        <p role="status" className="field-hint">{saving ? 'Saving…' : shortUrl ? 'Your link has been saved.' : ''}</p>
        {shortUrl && (
          <div className="link-result">
            <label className="field-label" htmlFor="short-url">Your short link</label>
            <input id="short-url" readOnly value={shortUrl} />
            <p className="field-hint"><a href={shortUrl}>Open short link ↗</a></p>
          </div>
        )}
      </form>
    </section>
  );
}
