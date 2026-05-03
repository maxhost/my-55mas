'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Choice = 'guest' | 'signup' | 'login' | null;

type Props = {
  hints: {
    title: string;
    guest: string;
    signup: string;
    login: string;
    placeholder: string;
  };
};

export function AuthGatePlaceholder({ hints }: Props) {
  const [choice, setChoice] = useState<Choice>(null);

  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="text-sm font-medium">{hints.title}</legend>

      <div className="grid gap-2 md:grid-cols-3">
        <Button
          type="button"
          variant={choice === 'guest' ? 'default' : 'outline'}
          onClick={() => setChoice('guest')}
        >
          {hints.guest}
        </Button>
        <Button
          type="button"
          variant={choice === 'signup' ? 'default' : 'outline'}
          onClick={() => setChoice('signup')}
        >
          {hints.signup}
        </Button>
        <Button
          type="button"
          variant={choice === 'login' ? 'default' : 'outline'}
          onClick={() => setChoice('login')}
        >
          {hints.login}
        </Button>
      </div>

      {choice && (
        <p className="text-muted-foreground rounded-md border border-dashed p-2 text-xs italic">
          {hints.placeholder} ({choice})
        </p>
      )}
    </fieldset>
  );
}
