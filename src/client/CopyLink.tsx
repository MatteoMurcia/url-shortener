import { useRef, useState } from 'react';

export async function copyToClipboard(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined) {
  try {
    if (!clipboard) return false;
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyLink({ shortUrl }: { shortUrl: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState('');

  async function copy() {
    setCopying(true);
    setMessage('');
    const copied = await copyToClipboard(shortUrl, navigator.clipboard);
    setMessage(copied ? 'Link copied.' : 'Automatic copy is unavailable. Select the link and copy it manually.');
    setCopying(false);
    if (!copied) {
      input.current?.focus();
      input.current?.select();
    }
  }

  return (
    <div className="link-result">
      <label className="field-label" htmlFor="short-url">Your short link</label>
      <input id="short-url" ref={input} readOnly value={shortUrl} aria-describedby="copy-hint copy-status" />
      <p id="copy-hint" className="field-hint">You can also select this link and copy it manually.</p>
      <button type="button" disabled={copying} onClick={() => { void copy(); }}>
        {copying ? 'Copying…' : 'Copy short link'}
      </button>
      <p id="copy-status" role="status" className="field-hint">{message}</p>
      <p className="field-hint"><a href={shortUrl}>Open short link <span aria-hidden="true">↗</span></a></p>
    </div>
  );
}
