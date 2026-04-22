import { PersistenceError, type Sb } from './context';

// ── Auth fields collected from a form ──────────────
// v1: solo signUp en flow de registro. Cambio de email/password del usuario
// autenticado requiere supabase.auth.updateUser y queda fuera de scope v1.

export type AuthFields = {
  email?: string;
  password?: string;
  confirm_password?: string;
};

export type AuthSignUpOptions = {
  emailRedirectTo?: string;
  data?: Record<string, unknown>;
};

export type AuthWriteResult = {
  userId: string;
};

// Nunca pre-fill auth fields (consistent con spec).
// Un email/password editable debe usar persistence_type='db_column' (→ profiles).
export async function readAuth(): Promise<undefined> {
  return undefined;
}

export async function writeAuth(
  supabase: Sb,
  fields: AuthFields,
  options: AuthSignUpOptions = {}
): Promise<AuthWriteResult> {
  if (!fields.email || !fields.password) {
    throw new PersistenceError(
      'auth write requires both email and password fields',
      'write_failed'
    );
  }
  if (
    fields.confirm_password !== undefined &&
    fields.confirm_password !== fields.password
  ) {
    throw new PersistenceError(
      'auth write: password and confirm_password do not match',
      'write_failed'
    );
  }
  const { data, error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options,
  });
  if (error || !data.user) {
    throw new PersistenceError(
      `auth signUp failed: ${error?.message ?? 'unknown'}`,
      'write_failed'
    );
  }
  return { userId: data.user.id };
}
