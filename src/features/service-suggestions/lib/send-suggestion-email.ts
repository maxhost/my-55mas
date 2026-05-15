import { Resend } from 'resend';
import { env } from '@/lib/env';

export type SuggestionEmailPayload = {
  fullName: string;
  serviceNeeded: string;
  email: string;
  countryName: string;
  cityName: string;
  comments: string;
  locale: string;
};

let cachedClient: Resend | null = null;

// Lazy client. Throws a typed error the action maps to a clean toast.
function getResendClient(): { client: Resend; from: string; to: string } {
  const apiKey = env.RESEND_API_KEY;
  const from = env.SERVICE_SUGGESTIONS_FROM_EMAIL;
  const to = env.SERVICE_SUGGESTIONS_TO_EMAIL;
  if (!apiKey || !from || !to) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return { client: cachedClient, from, to };
}

export async function sendSuggestionEmail(
  p: SuggestionEmailPayload,
): Promise<void> {
  const { client, from, to } = getResendClient();

  const text = [
    `Nueva sugerencia de servicio (${p.locale})`,
    '',
    `Nombre: ${p.fullName}`,
    `Email: ${p.email}`,
    `País: ${p.countryName}`,
    `Ciudad: ${p.cityName}`,
    `Servicio que necesita: ${p.serviceNeeded}`,
    '',
    'Comentarios:',
    p.comments || '(sin comentarios)',
  ].join('\n');

  const { error } = await client.emails.send({
    from,
    to,
    replyTo: p.email,
    subject: `Sugerencia de servicio — ${p.fullName}`,
    text,
  });

  if (error) {
    throw new Error('EMAIL_SEND_FAILED');
  }
}
