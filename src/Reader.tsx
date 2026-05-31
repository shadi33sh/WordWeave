import styles from './Reader.module.css';

const PLACEHOLDER = `Paste any article text here — then click "Read Mode" to start exploring words.\n\nFor example: The luminous quality of twilight has long captivated painters and poets alike. There is something ineffable about that particular hour when the sky transitions from the warmth of day to the cool embrace of night — a phenomenon that scientists call crepuscular light. The ancient Greeks had a word for it, the Romans another, but no single English term quite captures the melancholy beauty of that liminal moment.`;

interface ReaderProps {
  text: string;
  onChange: (text: string) => void;
  editMode: boolean;
  selectedWord: string | null;
  onWordClick: (word: string) => void;
}

export function Reader({ text, onChange, editMode, selectedWord, onWordClick }: ReaderProps) {
  if (editMode) {
    return (
      <textarea
        className={styles.textarea}
        value={text}
        onChange={e => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />
    );
  }

  if (!text.trim()) {
    return (
      <div className={styles.emptyRead}>
        <p>No text yet — switch back to edit mode and paste an article.</p>
      </div>
    );
  }

  return (
    <div className={styles.readView}>
      {text.split('\n').map((line, li) => (
        <p key={li} className={styles.paragraph}>
          {line.split(/(\s+)/).map((part, pi) => {
            if (/^\s+$/.test(part)) return <span key={pi}>{part}</span>;
            const clean = part.replace(/[^a-zA-Z'-]/g, '');
            const isWord = clean.length >= 2;
            const isSelected = clean.toLowerCase() === selectedWord;

            return (
              <span
                key={pi}
                className={[
                  isWord ? styles.word : '',
                  isSelected ? styles.wordSelected : '',
                ].join(' ')}
                onClick={isWord ? () => onWordClick(part) : undefined}
              >
                {part}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
