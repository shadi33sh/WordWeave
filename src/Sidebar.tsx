import {} from 'react';
import type { DictionaryResult, Entry, Sense } from './types';
import styles from './Sidebar.module.css';

/* ── Hourglass spinner (mirrors RN rotating hourglass) ─────── */
function LoadingState({ word }: { word: string }) {
  return (
    <div>
      <div className={styles.headerCard}>
        <div className={styles.wordContainer}>
          <h2 className={styles.wordTitle}>{word}</h2>
          <div className={styles.accentLine} />
        </div>
      </div>
      <div className={styles.spinnerWrap}>
        <div className={styles.hourglassWrap}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 1 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
          </svg>
        </div>
        <p className={styles.loadingText}>Loading…</p>
      </div>
    </div>
  );
}

/* ── Error state ───────────────────────────────────────────── */
function ErrorState({ word, message }: { word: string; message: string }) {
  return (
    <div>
      <div className={styles.headerCard}>
        <div className={styles.wordContainer}>
          <h2 className={styles.wordTitle}>{word}</h2>
          <div className={styles.accentLine} />
        </div>
      </div>
      <div className={styles.errorWrap}>
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className={styles.errorText}>{message}</p>
      </div>
    </div>
  );
}

/* ── Empty idle state ──────────────────────────────────────── */
function IdleState() {
  return (
    <div className={styles.empty}>
      <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
      <p>Click any word to look it up</p>
    </div>
  );
}

/* ── Sense card ────────────────────────────────────────────── */
function SenseCard({ sense }: { sense: Sense }) {
  const examples = [
    ...(sense.examples ?? []),
    ...(sense.quotes ?? []).slice(0, 1).map(q => q.text),
  ].slice(0, 2);

  const arabicTranslations = (sense.translations ?? []).filter(
    t => t.language?.code === 'ar'
  );

  return (
    <div className={styles.senseCard}>
      {/* Definition row with bullet */}
      <div className={styles.definitionRow}>
        <div className={styles.bullet} />
        <p className={styles.definition}>{sense.definition}</p>
      </div>

      {/* Examples */}
      {examples.map((ex, i) => (
        <div key={i} className={styles.exampleBox}>
          <p className={styles.exampleText}>"{ex.length > 200 ? ex.slice(0, 200) + '…' : ex}"</p>
        </div>
      ))}

      {/* Arabic translations only (matching the RN code) */}
      {arabicTranslations.map((t, i) => (
        <div key={i} className={styles.translationBox}>
          <span className={styles.translationWord}>{t.word}</span>
          <span className={styles.translationLang}>({t.language?.name})</span>
        </div>
      ))}
    </div>
  );
}

/* ── Entry block ───────────────────────────────────────────── */
function EntryBlock({ entry }: { entry: Entry }) {
  return (
    <div className={styles.entryCard}>
      {/* Part of speech badge */}
      <div className={styles.posContainer}>
        <div className={styles.posBadge}>
          <span className={styles.partOfSpeech}>{entry.partOfSpeech}</span>
        </div>
      </div>

      {/* Word forms */}
      {(entry.forms ?? []).length > 0 && (
        <div className={styles.formsSection}>
          {entry.forms.map((f, i) => (
            <div key={i} className={styles.formChip}>
              <span className={styles.formText}>
                {f.word}{' '}
                {f.tags?.length > 0 && (
                  <span className={styles.formTag}>{f.tags.join(', ')}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Senses */}
      {(entry.senses ?? []).map((sense, i) => (
        <SenseCard key={i} sense={sense} />
      ))}

      {/* Synonyms */}
      {(entry as any).synonyms?.length > 0 && (
        <div className={styles.synonymsCard}>
          <p className={styles.sectionTitle}>Synonyms</p>
          <div className={styles.tagContainer}>
            {(entry as any).synonyms.map((syn: string, i: number) => (
              <div key={i} className={styles.synonymTag}>
                <span className={styles.synonymText}>{syn}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Sidebar ──────────────────────────────────────────── */
interface SidebarProps {
  word: string | null;
  data: DictionaryResult | null;
  loading: boolean;
  error: string | null;
}

export function Sidebar({ word, data, loading, error }: SidebarProps) {
  if (!word) return <IdleState />;
  if (loading) return <LoadingState word={word} />;
  if (error) return <ErrorState word={word} message={error} />;
  if (!data) return null;
  console.log(data)

  const entries = data.entries ?? [];
  return (
    <div className={styles.sidebar}>
      {/* Header card – big word + accent line */}
      <div className={styles.headerCard}>
        <div className={styles.wordContainer}>
          <h2 className={styles.wordTitle}>{data.word}</h2>
          <div className={styles.accentLine} />
        </div>
      </div>

      {/* Entry cards or empty */}
      {entries.length > 0 ? (
        entries.map((e, i) => <EntryBlock key={i} entry={e} />)
      ) : (
        <div className={styles.noDataWrap}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <p className={styles.noDataText}>No Data</p>
        </div>
      )}
    </div>
  );
}
