export interface Language {
  code: string;
  name: string;
}

export interface Pronunciation {
  type: string;
  text: string;
  tags: string[];
}

export interface WordForm {
  word: string;
  tags: string[];
}

export interface Translation {
  language: Language;
  word: string;
}

export interface Quote {
  text: string;
  reference: string;
}

export interface Subsense {
  definition: string;
  tags: string[];
  examples: string[];
  quotes: Quote[];
  synonyms: string[];
  antonyms: string[];
  translations: Translation[];
  subsenses: Subsense[];
}

export interface Sense extends Subsense {
  subsenses: Subsense[];
}

export interface Entry {
  language: Language;
  partOfSpeech: string;
  pronunciations: Pronunciation[];
  forms: WordForm[];
  senses: Sense[];
}

export interface DictionaryResult {
  word: string;
  entries: Entry[];
}
