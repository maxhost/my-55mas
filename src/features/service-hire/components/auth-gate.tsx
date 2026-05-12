'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signinAsGuest, signupClient, loginClient } from '../actions/auth-actions';
import type { FiscalIdTypeOption } from '../actions/list-fiscal-id-types';
import { GuestContactFields } from './guest-contact-fields';

export type AuthState =
  | { status: 'idle' }
  | { status: 'authenticated'; userId: string; choice: 'guest' | 'signup' | 'login' };

type Choice = 'guest' | 'signup' | 'login' | null;

type Props = {
  authState: AuthState;
  onAuthenticated: (s: Extract<AuthState, { status: 'authenticated' }>) => void;
  fiscalIdTypes: FiscalIdTypeOption[];
  hints: {
    title: string;
    guest: string;
    signup: string;
    login: string;
    signupName: string;
    signupEmail: string;
    signupPassword: string;
    signupPhone: string;
    signupConfirm: string;
    loginEmail: string;
    loginPassword: string;
    loginConfirm: string;
    authenticatedAs: string;
    asGuest: string;
    error: string;
    guestData: React.ComponentProps<typeof GuestContactFields>['hints'];
  };
};

export function AuthGate({ authState, onAuthenticated, fiscalIdTypes, hints }: Props) {
  const [choice, setChoice] = useState<Choice>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingGuestUserId, setPendingGuestUserId] = useState<string | null>(null);

  // Signup state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  if (authState.status === 'authenticated') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        ✓ {hints.authenticatedAs}{' '}
        <strong>
          {authState.choice === 'guest' ? hints.asGuest : email || authState.userId.slice(0, 8)}
        </strong>
      </div>
    );
  }

  if (pendingGuestUserId) {
    return (
      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="text-sm font-medium">{hints.title}</legend>
        <GuestContactFields
          fiscalIdTypes={fiscalIdTypes}
          onSaved={(userId) =>
            onAuthenticated({ status: 'authenticated', userId, choice: 'guest' })
          }
          hints={hints.guestData}
        />
      </fieldset>
    );
  }

  const handleGuest = () => {
    setError(null);
    startTransition(async () => {
      const r = await signinAsGuest();
      if ('error' in r) {
        setError(r.error.message);
        return;
      }
      // Two-phase: anonymous session created, now collect guest data before
      // marking the parent form authenticated.
      setPendingGuestUserId(r.data.userId);
    });
  };

  const handleSignup = () => {
    setError(null);
    startTransition(async () => {
      // Sessions 4-5: signup also captures fiscal data. Signup-with-fiscal UI
      // lands in Session 5; for now signup falls back to legacy (no fiscal)
      // and signupClient will reject — the user should pick guest or login.
      const r = await signupClient({ full_name: name, email, password, phone });
      if ('error' in r) {
        setError(r.error.message);
        return;
      }
      onAuthenticated({ status: 'authenticated', userId: r.data.userId, choice: 'signup' });
    });
  };

  const handleLogin = () => {
    setError(null);
    startTransition(async () => {
      const r = await loginClient({ email, password });
      if ('error' in r) {
        setError(r.error.message);
        return;
      }
      onAuthenticated({ status: 'authenticated', userId: r.data.userId, choice: 'login' });
    });
  };

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

      {choice === 'guest' && (
        <Button type="button" disabled={isPending} onClick={handleGuest}>
          {isPending ? '…' : hints.guest}
        </Button>
      )}

      {choice === 'signup' && (
        <div className="space-y-2 border-t pt-3">
          <div>
            <Label htmlFor="signup-name">{hints.signupName}</Label>
            <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-email">{hints.signupEmail}</Label>
            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-password">{hints.signupPassword}</Label>
            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-phone">{hints.signupPhone}</Label>
            <Input id="signup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="button" disabled={isPending} onClick={handleSignup}>
            {isPending ? '…' : hints.signupConfirm}
          </Button>
        </div>
      )}

      {choice === 'login' && (
        <div className="space-y-2 border-t pt-3">
          <div>
            <Label htmlFor="login-email">{hints.loginEmail}</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="login-password">{hints.loginPassword}</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="button" disabled={isPending} onClick={handleLogin}>
            {isPending ? '…' : hints.loginConfirm}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
          {hints.error}: {error}
        </p>
      )}
    </fieldset>
  );
}
