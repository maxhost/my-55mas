export type SuggestionInput = {
  fullName: string;
  serviceNeeded: string;
  email: string;
  countryId: string;
  cityId: string;
  comments: string;
  locale: string;
  // Anti-spam (validated server-side, never shown to the user).
  honeypot: string;
  elapsedMs: number;
};

export type SuggestionResult =
  | { data: { ok: true } }
  | {
      error: {
        code:
          | 'invalid'
          | 'spam'
          | 'invalid-location'
          | 'email-not-configured'
          | 'send-failed';
        fieldErrors?: Record<string, string[]>;
      };
    };
