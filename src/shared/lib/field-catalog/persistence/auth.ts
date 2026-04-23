import { PersistenceError, type Sb } from './context';

// ── Auth fields collected from a form ──────────────
// 2 flows soportados:
// - Signup (userId=null): writeAuth hace supabase.auth.signUp con email+password.
// - Edit (userId presente): writeAuth detecta si el email cambió respecto
//   del actual y, si allow_change=true, llama supabase.auth.updateUser
//   (Supabase envía email de confirmación — hasta que el user confirme,
//   auth.users.email no cambia).

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
  // Indica si writeAuth hizo un update (vs signup o no-op). El caller
  // puede usarlo para mostrar mensaje "email pendiente de confirmación".
  emailUpdateRequested?: boolean;
};

export type AuthWriteOptions = {
  signUp?: AuthSignUpOptions;
  // userId presente = edit flow. Si email changed + allowChange → updateUser.
  // Si email changed + !allowChange → PersistenceError.
  currentUserId?: string | null;
  // Email actual del user (si currentUserId). Para detectar cambios sin
  // hacer otra query.
  currentEmail?: string | null;
  allowChange?: boolean;
};

// Lee el email del user autenticado.
// - Si userId null → undefined (signup flow: no hay user todavía).
// - Si userId presente → query supabase.auth.getUser() (usa la sesión del
//   server client). Defensive: verifica que el id matchee para evitar
//   exponer email de otro user si la sesión y el userId divergen.
export async function readAuth(
  supabase: Sb,
  userId: string | null
): Promise<string | undefined> {
  if (!userId) return undefined;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return undefined;
  if (data.user.id !== userId) return undefined;
  return data.user.email ?? undefined;
}

export async function writeAuth(
  supabase: Sb,
  fields: AuthFields,
  opts: AuthWriteOptions = {}
): Promise<AuthWriteResult> {
  // ── Edit flow ──
  if (opts.currentUserId) {
    const newEmail = fields.email?.trim();
    const currentEmail = (opts.currentEmail ?? '').trim();

    // Sin email nuevo en el form, o igual al actual → no-op.
    if (!newEmail || newEmail === currentEmail) {
      return { userId: opts.currentUserId, emailUpdateRequested: false };
    }

    // Email cambió pero el field no permite cambio → rechazar.
    if (!opts.allowChange) {
      throw new PersistenceError(
        'auth email change not allowed for this field',
        'write_failed'
      );
    }

    // Dispara flow de confirmación. auth.users.email no cambia hasta que
    // el user clickee el link que Supabase envía al email NUEVO.
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      throw new PersistenceError(
        `auth updateUser failed: ${error.message}`,
        'write_failed'
      );
    }
    return { userId: opts.currentUserId, emailUpdateRequested: true };
  }

  // ── Signup flow (sin currentUserId) ──
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
    options: opts.signUp,
  });
  if (error || !data.user) {
    throw new PersistenceError(
      `auth signUp failed: ${error?.message ?? 'unknown'}`,
      'write_failed'
    );
  }
  return { userId: data.user.id, emailUpdateRequested: false };
}
