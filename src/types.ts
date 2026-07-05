/**
 * Shared data shapes for lessons, words, exercises, and the placement quiz.
 * These are the *contract* between the AI generator (server) and the app (client):
 * the API route must return JSON matching these types, and the app renders from them.
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

/** A vocabulary item introduced in the LEARN phase (heard + translated first). */
export type Word = {
  id: string; // stable key, e.g. "travel-airport"
  en: string; // English word/phrase
  he: string; // Hebrew translation
  example: string; // example sentence in English using the word
};

/** The four interactive exercise types, ordered easy -> hard in a lesson. */
export type Exercise =
  | {
      type: 'listen_choose'; // hear the word (TTS) -> pick its meaning
      wordId: string;
      en: string; // the word spoken aloud
      options: string[]; // Hebrew meanings
      answer: string; // correct Hebrew meaning
    }
  | {
      type: 'multiple_choice'; // read a prompt -> pick the answer
      wordId: string;
      prompt: string;
      options: string[];
      answerIndex: number;
    }
  | {
      type: 'translate'; // produce the English word from Hebrew
      wordId: string;
      prompt: string; // Hebrew word to translate
      answer: string; // expected English
      hints?: string[];
    }
  | {
      type: 'fill_blank'; // use the word in context
      wordId: string;
      sentence: string; // sentence with "___" where the word goes
      options: string[];
      answer: string;
    };

export type ExerciseType = Exercise['type'];

/** A full lesson: new words + escalating practice exercises. */
export type Lesson = {
  id: string;
  title: string;
  level: CEFRLevel;
  category: string;
  xpReward: number;
  words: Word[];
  exercises: Exercise[];
};

/** Lightweight metadata for the learning path (content generated lazily). */
export type LessonMeta = {
  id: string;
  title: string;
  category: string;
  icon: string; // emoji shown on the path node
};

/** One placement-quiz question (used during onboarding to verify real level). */
export type PlacementQuestion = {
  level: CEFRLevel; // difficulty band this question probes
  prompt: string;
  options: string[];
  answerIndex: number;
};
