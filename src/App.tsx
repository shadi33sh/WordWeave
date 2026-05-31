import { useState, useRef, useEffect } from 'react';
import { Reader } from './Reader';
import { Sidebar } from './Sidebar';
import { PDFViewer } from './PDFViewer';
import { useDictionary } from './useDictionary';
import styles from './App.module.css';

export default function App() {
  const [text, setText] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const { word, data, loading, error, lookup } = useDictionary();
  function handleWordClick(raw: string) {
    lookup(raw);
  }

  function toggleMode() {
    setEditMode(m => !m);
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 280 && newWidth <= 400) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8" />
              <path d="M9 9l3-3 3 3" />
              <path d="M9 15l3 3 3-3" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <h1 className={styles.appTitle}>WordWeave</h1>
            <p className={styles.appSub}>Explore · discover · understand</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {!editMode && word && (
            <span className={styles.currentWord}>
              Looking at: <strong>{word}</strong>
            </span>
          )}
          <div className={styles.modeButtonGroup}>
            {viewMode === 'text' && (
              <button className={styles.modeBtn} onClick={toggleMode}>
                {editMode ? (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Read Mode
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Text
                  </>
                )}
              </button>
            )}
            <button className={`${styles.modeBtn} ${viewMode === 'pdf' ? styles.active : ''}`} onClick={() => setViewMode(viewMode === 'pdf' ? 'text' : 'pdf')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              {viewMode === 'pdf' ? 'Text Mode' : 'PDF'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.readerPane}>
          {viewMode === 'text' ? (
            <Reader
              text={text}
              onChange={setText}
              editMode={editMode}
              selectedWord={word}
              onWordClick={handleWordClick}
            />
          ) : (
            <PDFViewer
              onWordClick={handleWordClick}
              selectedWord={word}
            />
          )}
        </div>

        <div 
          ref={dividerRef}
          className={styles.divider} 
          onMouseDown={() => setIsDragging(true)}
        />

        <aside className={styles.sidebarPane} style={{ width: `${sidebarWidth}px` }}>
          <Sidebar word={word} data={data} loading={loading} error={error} />
        </aside>
      </main>
    </div>
  );
}
