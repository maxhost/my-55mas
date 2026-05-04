export const QUESTION_TYPES = [
  'text',
  'multilineText',
  'number',
  'boolean',
  'singleSelect',
  'multiSelect',
  'file',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export type QuestionI18nEntry = {
  label?: string;
  placeholder?: string;
  help?: string;
};

export type ManualOption = {
  value: string;
  i18n: Record<string, { label?: string }>;
};

export type FileConfig = {
  allowedTypes: string[]; // mime type prefixes or full types, e.g. 'image/*', 'application/pdf'
  maxSizeMb: number;
};

export type Question = {
  key: string;
  type: QuestionType;
  required: boolean;
  i18n: Record<string, QuestionI18nEntry>;

  // single/multiSelect only:
  optionsSource?: 'manual' | 'subtype';
  options?: ManualOption[];
  subtypeGroupSlug?: string;
  subtypeExcludedIds?: string[];

  // file only:
  fileConfig?: FileConfig;
};

/** Which column on `services` we are persisting to: client-facing or talent-facing question list. */
export type QuestionTarget = 'client' | 'talent';

export type SaveQuestionsInput = {
  serviceId: string;
  target: QuestionTarget;
  questions: Question[];
};

export const DEFAULT_FILE_CONFIG: FileConfig = {
  allowedTypes: ['image/*'],
  maxSizeMb: 10,
};

/** Minimal shape needed to render subtype-source pickers. The caller (app
 * layer) maps from the `subtypes` feature's full SubtypeGroupWithTranslations
 * to this — keeps service-questions free of cross-feature imports. */
export type AssignedSubtypeGroup = {
  id: string;
  slug: string;
  translations: Record<string, string>;
  items: Array<{
    id: string;
    slug: string;
    translations: Record<string, string>;
  }>;
};

export const FILE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'image/*', label: 'Imágenes (jpg, png, webp, etc.)' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'video/*', label: 'Video' },
  { value: 'audio/*', label: 'Audio' },
];
