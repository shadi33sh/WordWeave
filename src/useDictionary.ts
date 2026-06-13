import { useState, useRef, useCallback } from 'react';
import type { DictionaryResult } from './types';

interface LookupState {
  data: DictionaryResult | null;
  loading: boolean;
  error: string | null;
  word: string | null;
}

/**
 * Convert plural words to singular form
 * Handles common English plural patterns
 */
function singularize(word: string): string {
  // If word doesn't end with 's', it's likely not plural
  if (!word.endsWith('s')) {
    return word;
  }

  // Words ending in 'ies' -> 'y' (tries -> try, babies -> baby)
  if (word.endsWith('ies') && word.length > 3) {
    return word.slice(0, -3) + 'y';
  }

  // Words ending in 'xes', 'zes', 'ches', 'shes', 'sses' -> remove 'es' (boxes -> box, bushes -> bush)
  if (
    (word.endsWith('xes') || word.endsWith('zes') || word.endsWith('ches') ||
      word.endsWith('shes') || word.endsWith('sses')) &&
    word.length > 2
  ) {
    return word.slice(0, -2);
  }

  // Words ending in 'oes' -> 'o' (heroes -> hero, potatoes -> potato)
  if (word.endsWith('oes') && word.length > 3) {
    return word.slice(0, -2);
  }

  // Words ending in 'ses' -> 'sis' (bases -> basis, analyses -> analysis)
  if (word.endsWith('ses') && word.length > 3) {
    return word.slice(0, -2) + 'is';
  }

  // Default: just remove the 's' (cats -> cat, dogs -> dog)
  if (word.length > 1) {
    return word.slice(0, -1);
  }

  return word;
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
    const cleanedWord = raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (!cleanedWord || cleanedWord.length < 2) return;

    // Singularize the word first
    const singularWord = singularize(cleanedWord);
    const displayWord = singularWord; // Show singular form in UI

    setState(s => ({ ...s, word: displayWord, error: null }));

    // Check cache for singular form first
    if (cache.current[singularWord]) {
      setState({ data: cache.current[singularWord], loading: false, error: null, word: displayWord });
      return;
    }

    setState({ data: null, loading: true, error: null, word: displayWord });

    try {
      // Try singular form first
      let res = await fetch(
        `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(singularWord)}?translations=true`
      );

      // If singular form not found and it's different from original, try original
      if (!res.ok && singularWord !== cleanedWord) {
        res = await fetch(
          `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(cleanedWord)}?translations=true`
        );
      }

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? `"${displayWord}" not found in dictionary`
            : `API error ${res.status}`
        );
      }

      const json: DictionaryResult = await res.json();
      console.log(json);

      cache.current[singularWord] = json;
      setState({ data: json, loading: false, error: null, word: displayWord });
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
