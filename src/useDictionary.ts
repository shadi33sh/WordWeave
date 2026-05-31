import { useState, useRef, useCallback } from 'react';
import type { DictionaryResult } from './types';

interface LookupState {
  data: DictionaryResult | null;
  loading: boolean;
  error: string | null;
  word: string | null;
}

export function useDictionary() {
  const [state, setState] = useState<LookupState>({
    data: null,
    loading: false,
    error: null,
    word: null,
  });

  const cache = useRef<Record<string, DictionaryResult>>({});

  const lookup = useCallback(async (raw: string) => {
    const word = raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (!word || word.length < 2) return;

    setState(s => ({ ...s, word, error: null }));

    if (cache.current[word]) {
      setState({ data: cache.current[word], loading: false, error: null, word });
      return;
    }

    setState({ data: null, loading: true, error: null, word });

    try {
      const res = await fetch(
        `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}?translations=true`
      );
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? `"${word}" not found in dictionary`
            : `API error ${res.status}`
        );
      }
      const json: DictionaryResult[] = await res.json();
      console.log(json)
      
      cache.current[word] = json; // Cache the first result for simplicity
      setState({ data: json, loading: false, error: null, word });
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      }));
    }
  }, []);

  return { ...state, lookup };
}
