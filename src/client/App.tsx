export function App() {
  return (
    <div className="page">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="header">
        <a className="brand" href="/" aria-label="URL Shortener home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>URL Shortener</span>
        </a>
        <a className="source-link" href="https://github.com/MatteoMurcia/url-shortener">
          View source <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="intro">
          <p className="eyebrow">LESS TO SEND. MORE TO SHARE.</p>
          <h1>A little<br />less link.</h1>
          <p className="description">
            Give your next great find a shorter way to get there.
            Simple links, made for sharing.
          </p>
          <p className="development-note">
            <span className="status-dot" aria-hidden="true" />
            In development — link creation is coming next.
          </p>
        </div>

        <figure className="example" aria-labelledby="example-caption">
          <div className="example-label">THE IDEA IS SIMPLE</div>
          <div className="long-link">
            <span className="link-label">Start with a destination</span>
            <span className="url">example.com/a/long/link?with=possibilities</span>
          </div>
          <div className="connector" aria-hidden="true">↓</div>
          <div className="short-link">
            <span className="link-label">Make room for what matters</span>
            <span className="url">short.example/hello <span aria-hidden="true">↗</span></span>
          </div>
          <figcaption id="example-caption">An illustration of what’s coming. These links are examples.</figcaption>
        </figure>
      </main>

      <footer className="footer">
        <span>Small links. Thoughtfully built.</span>
        <span>An open-source project by Matteo Murcia</span>
      </footer>
    </div>
  );
}
