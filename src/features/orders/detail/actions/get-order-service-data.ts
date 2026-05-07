'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { Question } from '@/shared/lib/questions/types';
import type { OrderScheduleType } from '../../types';
import type { ServiceTabContext, ServiceTabData } from '../types';

type Result = {
  data: ServiceTabData;
  context: ServiceTabContext;
};

export async function getOrderServiceData(
  orderId: string,
  locale: string,
): Promise<Result | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, service_id, preferred_language, service_address, service_city_id, service_postal_code, schedule_type, notes, talents_needed, form_data, appointment_date',
    )
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const [serviceRes, langsRes, countriesRes, citiesRes, recurrenceRes] = await Promise.all([
    order.service_id
      ? supabase
          .from('services')
          .select('id, slug, i18n, questions')
          .eq('id', order.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('spoken_languages')
      .select('code, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('countries').select('id, code, i18n').eq('is_active', true),
    supabase.from('cities').select('id, country_id, i18n'),
    supabase
      .from('order_recurrence')
      .select('repeat_every, weekdays, start_date, end_date, time_window_start, time_window_end, hours_per_session')
      .eq('order_id', orderId)
      .maybeSingle(),
  ]);

  const service = serviceRes.data;
  const questions = ((service?.questions as unknown) as Question[]) ?? [];
  const answers = ((order.form_data as unknown) as Record<string, unknown>) ?? {};
  const recurrence = recurrenceRes.data;

  const data: ServiceTabData = {
    language: { preferred_language: order.preferred_language ?? null },
    address: {
      service_address: order.service_address,
      service_city_id: order.service_city_id,
      service_postal_code: order.service_postal_code,
    },
    serviceAnswers: {
      service_id: order.service_id,
      service_name: service
        ? localizedField(service.i18n as I18nRecord, locale, 'name') ?? service.slug
        : null,
      questions,
      answers,
    },
    recurrence: {
      schedule_type: (order.schedule_type as OrderScheduleType) ?? 'once',
      repeat_every: recurrence?.repeat_every ?? 1,
      weekdays: recurrence?.weekdays ?? [],
      start_date: recurrence?.start_date ?? (order.appointment_date?.substring(0, 10) ?? null),
      end_date: recurrence?.end_date ?? null,
      time_window_start: recurrence?.time_window_start ?? null,
      time_window_end: recurrence?.time_window_end ?? null,
      hours_per_session:
        recurrence?.hours_per_session === null || recurrence?.hours_per_session === undefined
          ? null
          : Number(recurrence.hours_per_session),
    },
    notesData: {
      notes: order.notes ?? null,
      talents_needed: order.talents_needed ?? 1,
    },
  };

  const context: ServiceTabContext = {
    spokenLanguages: (langsRes.data ?? []).map((l) => ({
      code: l.code,
      name: localizedField(l.i18n as I18nRecord, locale, 'name') ?? l.code,
    })),
    countries: (countriesRes.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
    })),
    cities: (citiesRes.data ?? []).map((c) => ({
      id: c.id,
      country_id: c.country_id,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? '',
    })),
  };

  return { data, context };
}
