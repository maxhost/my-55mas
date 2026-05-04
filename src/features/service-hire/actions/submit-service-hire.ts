'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import type { Question } from '@/shared/lib/questions';
import { submitServiceHireSchema } from '../schemas';

type SubmitResult = { data: { orderId: string } } | { error: { message: string } };

const BUCKET = 'order-attachments';

export async function submitServiceHire(formData: FormData): Promise<SubmitResult> {
  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: { message: 'Not authenticated' } };
  }
  const userId = authData.user.id;

  const stateRaw = formData.get('state');
  if (typeof stateRaw !== 'string') {
    return { error: { message: 'Missing state' } };
  }
  let stateJson: unknown;
  try {
    stateJson = JSON.parse(stateRaw);
  } catch {
    return { error: { message: 'Invalid state JSON' } };
  }
  const parsed = submitServiceHireSchema.safeParse(stateJson);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid form' } };
  }
  const state = parsed.data;

  // Load service to know countries/questions.
  const { data: service } = await supabase
    .from('services')
    .select('id, questions')
    .eq('id', state.serviceId)
    .eq('status', 'published')
    .maybeSingle();
  if (!service) {
    return { error: { message: 'Service not found' } };
  }
  const questions = (service.questions as unknown as Question[]) ?? [];

  // Resolve country_id + city_id from address country_code / city_name.
  const { data: country } = await supabase
    .from('countries')
    .select('id')
    .eq('code', state.address.country_code.toUpperCase())
    .maybeSingle();
  if (!country) {
    return { error: { message: 'Country not supported' } };
  }
  let serviceCityId: string | null = null;
  if (state.address.city_name) {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('country_id', country.id)
      .ilike('slug', state.address.city_name.toLowerCase().replace(/\s+/g, '-'))
      .maybeSingle();
    serviceCityId = city?.id ?? null;
  }

  // Compose appointment_date for once schedules.
  const appointmentDate =
    state.scheduling.schedule_type === 'once' && state.scheduling.start_date
      ? new Date(`${state.scheduling.start_date}T${state.scheduling.time_start}:00`).toISOString()
      : null;

  // Get current user profile for contact fields.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', userId)
    .maybeSingle();

  // INSERT order. Files are uploaded after order_id is known so paths are stable.
  const adminClient = createAdminClient();
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      client_id: userId,
      service_id: state.serviceId,
      country_id: country.id,
      service_city_id: serviceCityId,
      service_address: state.address.raw_text,
      service_postal_code: state.address.postal_code || null,
      schedule_type: state.scheduling.schedule_type,
      appointment_date: appointmentDate,
      contact_name: profile?.full_name ?? authData.user.email ?? 'Guest',
      contact_email: profile?.email ?? authData.user.email ?? '',
      contact_phone: profile?.phone ?? '',
      notes: state.notes || null,
      status: 'pending',
      payment_status: 'pending',
      price_subtotal: 0,
      price_tax_rate: 0,
      price_tax: 0,
      price_total: 0,
      currency: 'EUR',
      form_data: state.answers as unknown as Json,
    })
    .select('id')
    .single();
  if (orderError || !order) {
    return { error: { message: orderError?.message ?? 'Order creation failed' } };
  }
  const orderId = order.id;

  // Upload files: keys with FormData entries named `file:{question_key}:{index}`.
  const uploadedAnswers: Record<string, string[]> = {};
  const fileEntries: Array<[string, File]> = [];
  formData.forEach((value, key) => {
    if (key.startsWith('file:') && value instanceof File) {
      fileEntries.push([key, value]);
    }
  });
  for (const [key, file] of fileEntries) {
    const [, questionKey] = key.split(':');
    const path = `${orderId}/${questionKey}/${file.name}`;
    const { error: upErr } = await adminClient.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      return { error: { message: `File upload failed: ${upErr.message}` } };
    }
    uploadedAnswers[questionKey] = uploadedAnswers[questionKey] ?? [];
    uploadedAnswers[questionKey].push(path);
  }
  if (Object.keys(uploadedAnswers).length > 0) {
    const merged = { ...state.answers, ...uploadedAnswers } as unknown as Json;
    await adminClient.from('orders').update({ form_data: merged }).eq('id', orderId);
  }

  // Insert order_subtypes for answers from subtype-source questions.
  const subtypeRows: Array<{ order_id: string; subtype_id: string; question_key: string }> = [];
  for (const q of questions) {
    if (q.optionsSource !== 'subtype') continue;
    const ans = state.answers[q.key];
    const ids = Array.isArray(ans) ? (ans as string[]) : typeof ans === 'string' && ans ? [ans] : [];
    for (const id of ids) {
      subtypeRows.push({ order_id: orderId, subtype_id: id, question_key: q.key });
    }
  }
  if (subtypeRows.length > 0) {
    const { error: subErr } = await adminClient.from('order_subtypes').insert(subtypeRows);
    if (subErr) {
      return { error: { message: `Subtype mirror failed: ${subErr.message}` } };
    }
  }

  // Insert order_schedule for recurring orders.
  if (state.scheduling.schedule_type === 'recurring') {
    const s = state.scheduling;
    await adminClient.from('order_schedules').insert({
      order_id: orderId,
      start_date: s.start_date,
      end_date: s.end_date ?? null,
      time_start: s.time_start,
      time_end: s.time_end ?? null,
      timezone: 'Europe/Madrid',
      weekdays: s.frequency === 'weekly' ? s.weekdays ?? null : null,
      day_of_month: s.frequency === 'monthly' ? s.day_of_month ?? null : null,
      generation_paused: false,
    });
  }

  revalidatePath('/[locale]/dashboard', 'layout');
  return { data: { orderId } };
}
