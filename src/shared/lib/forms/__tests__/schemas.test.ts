import { describe, it, expect } from 'vitest';
import { formFieldSchema, stepActionSchema, formStepSchema, formSchemaSchema } from '../schemas';

// ── Field types ──────────────────────────────────────

describe('formFieldSchema — email/password types', () => {
  it('accepts email field', () => {
    const result = formFieldSchema.safeParse({
      key: 'user_email',
      type: 'email',
      required: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts password field', () => {
    const result = formFieldSchema.safeParse({
      key: 'user_password',
      type: 'password',
      required: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiselect with static options', () => {
    const result = formFieldSchema.safeParse({
      key: 'topics',
      type: 'multiselect',
      required: false,
      options: ['a', 'b'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiselect with options_snapshot only (dynamic source)', () => {
    const result = formFieldSchema.safeParse({
      key: 'other_language',
      type: 'multiselect',
      required: false,
      options_snapshot: [
        { value: 'pt', label: 'Português' },
        { value: 'en', label: 'Inglês' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects multiselect without options or options_snapshot', () => {
    const result = formFieldSchema.safeParse({
      key: 'topics',
      type: 'multiselect',
      required: false,
    });
    expect(result.success).toBe(false);
  });
});

// ── Step actions ─────────────────────────────────────

describe('stepActionSchema', () => {
  it('accepts next action', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_next',
      type: 'next',
    });
    expect(result.success).toBe(true);
  });

  it('accepts back action', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_back',
      type: 'back',
    });
    expect(result.success).toBe(true);
  });

  it('accepts submit with redirect_url', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_submit',
      type: 'submit',
      redirect_url: '/gracias',
    });
    expect(result.success).toBe(true);
  });

  it('accepts register with redirect_url', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_register',
      type: 'register',
      redirect_url: '/portal',
    });
    expect(result.success).toBe(true);
  });

  it('accepts action without redirect_url', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_submit',
      type: 'submit',
    });
    expect(result.success).toBe(true);
  });

  it('rejects redirect_url not starting with /', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_submit',
      type: 'submit',
      redirect_url: 'https://external.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action type', () => {
    const result = stepActionSchema.safeParse({
      key: 'btn_invalid',
      type: 'goto',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing key', () => {
    const result = stepActionSchema.safeParse({
      type: 'next',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid key format', () => {
    const result = stepActionSchema.safeParse({
      key: 'Bad Key',
      type: 'next',
    });
    expect(result.success).toBe(false);
  });
});

// ── Form step with actions ───────────────────────────

describe('formStepSchema — with actions', () => {
  const validField = { key: 'name', type: 'text' as const, required: true };

  it('accepts step with actions', () => {
    const result = formStepSchema.safeParse({
      key: 'step_1',
      fields: [validField],
      actions: [
        { key: 'btn_next', type: 'next' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts step with multiple actions', () => {
    const result = formStepSchema.safeParse({
      key: 'step_2',
      fields: [validField],
      actions: [
        { key: 'btn_back', type: 'back' },
        { key: 'btn_register', type: 'register', redirect_url: '/portal' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts step without actions (optional)', () => {
    const result = formStepSchema.safeParse({
      key: 'step_1',
      fields: [validField],
    });
    expect(result.success).toBe(true);
  });

  it('accepts step with empty actions array', () => {
    const result = formStepSchema.safeParse({
      key: 'step_1',
      fields: [validField],
      actions: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects step with invalid action', () => {
    const result = formStepSchema.safeParse({
      key: 'step_1',
      fields: [validField],
      actions: [{ key: 'btn', type: 'invalid_type' }],
    });
    expect(result.success).toBe(false);
  });
});

// ── Full form schema ─────────────────────────────────
// Note: db_column validation tests are in db-column-schemas.test.ts

describe('formSchemaSchema — wizard form', () => {
  it('accepts a multi-step wizard form', () => {
    const result = formSchemaSchema.safeParse({
      steps: [
        {
          key: 'step_1',
          fields: [
            { key: 'user_email', type: 'email', required: true },
            { key: 'user_password', type: 'password', required: true },
          ],
          actions: [{ key: 'btn_next', type: 'next' }],
        },
        {
          key: 'step_2',
          fields: [
            { key: 'question_1', type: 'text', required: false },
          ],
          actions: [
            { key: 'btn_back', type: 'back' },
            { key: 'btn_register', type: 'register', redirect_url: '/portal' },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
