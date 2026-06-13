import { useState, useRef, useEffect } from 'react';
import styles from './HTMLViewer.module.css';

interface HTMLViewerProps {
  onWordClick: (word: string) => void;
  selectedWord: string | null;
}

const CORS_PROXY = 'https://corsproxy.io/?';

export function HTMLViewer({ onWordClick, selectedWord }: HTMLViewerProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleFetchURL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setHtmlContent(null);

    try {
      // Validate URL
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const proxyUrl = CORS_PROXY + encodeURIComponent(urlObj.toString());

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      let html = await response.text();

      // Extract main content - try common selectors
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Try to find main content (prioritize article/main tags)
      let content = doc.querySelector('article') ||
                    doc.querySelector('main') ||
                    doc.querySelector('[role="main"]') ||
                    doc.querySelector('.content') ||
                    doc.querySelector('#content') ||
                    doc.querySelector('.post') ||
                    doc.querySelector('.entry-content');

      if (!content) {
        content = doc.body;
      }

      // Remove scripts, styles, and ads
      const scripts = content.querySelectorAll('script, style, noscript, .ad, [class*="ad"], [id*="ad"]');
      scripts.forEach(el => el.remove());

      // Remove navigation and footer elements
      const nav = content.querySelectorAll('nav, .navbar, .menu, .sidebar, footer, .related, .comments');
      nav.forEach(el => el.remove());

      // Get clean HTML
      let cleanHtml = content.innerHTML;

      // Preserve links but make them safe
      cleanHtml = cleanHtml.replace(/on\w+\s*=/gi, 'data-blocked-');

      setHtmlContent(cleanHtml);
      setUrl('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching URL';
      setError(message);
      console.error('Error fetching URL:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setHtmlContent(null);
    setUrl('');
    setError(null);
  };

  const handleWordClick = (word: string) => {
    onWordClick(word);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleFetchURL} className={styles.form}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste a URL (blog, Wikipedia, article...)"
            disabled
            className={styles.input}
          />
          <button type="submit" disabled className={styles.button}>
            Loading...
          </button>
        </form>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Fetching content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleFetchURL} className={styles.form}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste a URL (blog, Wikipedia, article...)"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Load
          </button>
        </form>
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>Error loading URL</p>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>Try another URL or check if it's publicly accessible</p>
        </div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className={styles.container}>
        <form onSubmit={handleFetchURL} className={styles.form}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste a URL (blog, Wikipedia, article...)"
            className={styles.input}
          />
          <button type="submit" className={styles.button} disabled={!url.trim()}>
            Load
          </button>
        </form>
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p>Paste a blog link, Wikipedia page, or any article URL</p>
          <p className={styles.hint}>The content will be cleaned and ready for reading</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button onClick={handleClear} className={styles.clearButton}>
          ← Load Different URL
        </button>
      </div>
      <div
        ref={contentRef}
        className={styles.content}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            e.preventDefault();
          }
          // Check if clicked element or parent is a word
          let element = target;
          if (element.classList.contains(styles.word)) {
            const text = element.textContent || '';
            const clean = text.replace(/[^a-zA-Z'-]/g, '');
            if (clean.length >= 2) {
              handleWordClick(text);
            }
          }
        }}
      >
        <HTMLContent
          html={htmlContent}
          selectedWord={selectedWord}
          onWordClick={handleWordClick}
          wordClass={styles.word}
          selectedWordClass={styles.wordSelected}
        />
      </div>
    </div>
  );
}

interface HTMLContentProps {
  html: string;
  selectedWord: string | null;
  onWordClick: (word: string) => void;
  wordClass: string;
  selectedWordClass: string;
}

function HTMLContent({
  html,
  selectedWord,
  onWordClick,
  wordClass,
  selectedWordClass,
}: HTMLContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Parse HTML and add word click handlers
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const parts = text.split(/(\s+)/);
        if (parts.length === 1) return;

        const container = document.createElement('span');
        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            container.appendChild(document.createTextNode(part));
          } else {
            const clean = part.replace(/[^a-zA-Z'-]/g, '');
            if (clean.length >= 2) {
              const span = document.createElement('span');
              span.className = wordClass;
              if (clean.toLowerCase() === selectedWord?.toLowerCase()) {
                span.classList.add(selectedWordClass);
              }
              span.textContent = part;
              span.style.cursor = 'pointer';
              span.addEventListener('click', (e) => {
                e.stopPropagation();
                onWordClick(part);
              });
              container.appendChild(span);
            } else {
              container.appendChild(document.createTextNode(part));
            }
          }
        });
        node.parentNode?.replaceChild(container, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        // Skip scripts, styles, and certain elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) {
          return;
        }
        Array.from(node.childNodes).forEach(processNode);
      }
    };

    const clonedContent = ref.current.cloneNode(true);
    processNode(clonedContent);
    ref.current.innerHTML = '';
    ref.current.appendChild(clonedContent);
  }, [selectedWord, onWordClick, wordClass, selectedWordClass]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
