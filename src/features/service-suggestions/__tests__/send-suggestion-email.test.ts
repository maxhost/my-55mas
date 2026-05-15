import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const envMock: Record<string, string | undefined> = {};
vi.mock('@/lib/env', () => ({
  get env() {
    return envMock;
  },
}));

import { sendSuggestionEmail } from '../lib/send-suggestion-email';

const payload = {
  fullName: 'Ana',
  serviceNeeded: 'Cocina',
  email: 'ana@example.com',
  countryName: 'España',
  cityName: 'Madrid',
  comments: 'hola',
  locale: 'es',
};

beforeEach(() => {
  sendMock.mockReset();
  envMock.RESEND_API_KEY = undefined;
  envMock.SERVICE_SUGGESTIONS_FROM_EMAIL = undefined;
  envMock.SERVICE_SUGGESTIONS_TO_EMAIL = undefined;
});

describe('sendSuggestionEmail', () => {
  it('throws EMAIL_NOT_CONFIGURED when any env is missing', async () => {
    await expect(sendSuggestionEmail(payload)).rejects.toThrow(
      'EMAIL_NOT_CONFIGURED',
    );
    envMock.RESEND_API_KEY = 'k';
    await expect(sendSuggestionEmail(payload)).rejects.toThrow(
      'EMAIL_NOT_CONFIGURED',
    );
  });

  it('sends with from/to/subject/text when configured', async () => {
    envMock.RESEND_API_KEY = 'k';
    envMock.SERVICE_SUGGESTIONS_FROM_EMAIL = 'from@x.com';
    envMock.SERVICE_SUGGESTIONS_TO_EMAIL = 'to@x.com';
    sendMock.mockResolvedValueOnce({ error: null });

    await sendSuggestionEmail(payload);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0][0];
    expect(arg.from).toBe('from@x.com');
    expect(arg.to).toBe('to@x.com');
    expect(arg.replyTo).toBe('ana@example.com');
    expect(arg.subject).toContain('Ana');
    expect(arg.text).toContain('España');
    expect(arg.text).toContain('Madrid');
  });

  it('throws EMAIL_SEND_FAILED when Resend returns an error', async () => {
    envMock.RESEND_API_KEY = 'k';
    envMock.SERVICE_SUGGESTIONS_FROM_EMAIL = 'from@x.com';
    envMock.SERVICE_SUGGESTIONS_TO_EMAIL = 'to@x.com';
    sendMock.mockResolvedValueOnce({ error: { message: 'boom' } });

    await expect(sendSuggestionEmail(payload)).rejects.toThrow(
      'EMAIL_SEND_FAILED',
    );
  });
});
