import { z } from 'zod';
import { ORDER_STATUSES, ORDER_SCHEDULE_TYPES } from '../types';

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time');

// ── Header / status / cancel ────────────────────────────────

export const updateOrderStatusSchema = z.object({
  orderId: uuid,
  status: z.enum(ORDER_STATUSES),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const updateOrderTagsSchema = z.object({
  orderId: uuid,
  tagIds: z.array(uuid),
});
export type UpdateOrderTagsInput = z.infer<typeof updateOrderTagsSchema>;

export const cancelOrderSchema = z.object({
  orderId: uuid,
  reason: z.string().max(2000).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

// ── Service tab section saves ───────────────────────────────

export const saveOrderLanguageSchema = z.object({
  orderId: uuid,
  preferred_language: z.string().min(2).nullable(),
});
export type SaveOrderLanguageInput = z.infer<typeof saveOrderLanguageSchema>;

export const saveOrderAddressSchema = z.object({
  orderId: uuid,
  service_address: z.string().max(500).nullable(),
  service_city_id: uuid.nullable(),
  service_postal_code: z.string().max(20).nullable(),
});
export type SaveOrderAddressInput = z.infer<typeof saveOrderAddressSchema>;

export const saveOrderServiceAnswersSchema = z.object({
  orderId: uuid,
  answers: z.record(z.string(), z.unknown()),
});
export type SaveOrderServiceAnswersInput = z.infer<typeof saveOrderServiceAnswersSchema>;

export const saveOrderRecurrenceSchema = z.object({
  orderId: uuid,
  schedule_type: z.enum(ORDER_SCHEDULE_TYPES),
  repeat_every: z.number().int().min(1).max(365),
  weekdays: z.array(z.number().int().min(0).max(6)),
  start_date: isoDate.nullable(),
  end_date: isoDate.nullable(),
  time_window_start: hhmm.nullable(),
  time_window_end: hhmm.nullable(),
  hours_per_session: z.number().min(0).max(24).nullable(),
});
export type SaveOrderRecurrenceInput = z.infer<typeof saveOrderRecurrenceSchema>;

export const saveOrderNotesSchema = z.object({
  orderId: uuid,
  notes: z.string().max(5000).nullable(),
  talents_needed: z.number().int().min(1).max(50),
});
export type SaveOrderNotesInput = z.infer<typeof saveOrderNotesSchema>;

// ── Specialists ─────────────────────────────────────────────

export const addOrderTalentSchema = z.object({
  orderId: uuid,
  talentId: uuid,
});
export type AddOrderTalentInput = z.infer<typeof addOrderTalentSchema>;

export const removeOrderTalentSchema = z.object({
  orderId: uuid,
  talentId: uuid,
});
export type RemoveOrderTalentInput = z.infer<typeof removeOrderTalentSchema>;

// ── Hours ───────────────────────────────────────────────────

const hoursLogEntrySchema = z.object({
  id: z.string(),                 // local or server id
  kind: z.enum(['hours', 'kilometers', 'other']),
  description: z.string().max(200).nullable(),
  unit_price: z.number().min(0).max(100000),
  reported_qty: z.number().min(0).max(100000),
  confirmed_qty: z.number().min(0).max(100000).nullable(),
});

export const saveOrderHoursSchema = z.object({
  orderId: uuid,
  totalHoursLog: hoursLogEntrySchema,
  totalKilometersLog: hoursLogEntrySchema,
  otherLogs: z.array(hoursLogEntrySchema),
});
export type SaveOrderHoursInput = z.infer<typeof saveOrderHoursSchema>;

// ── Billing ─────────────────────────────────────────────────

export const addBillingLineSchema = z.object({
  orderId: uuid,
  scope: z.enum(['client', 'talent']),
  talentId: uuid.nullable(),       // required when scope='talent'
  description: z.string().min(1).max(200),
  unit_price: z.number().min(0).max(100000),
  qty: z.number().min(0).max(10000),
  discount_pct: z.number().min(0).max(100).default(0),
});
export type AddBillingLineInput = z.infer<typeof addBillingLineSchema>;

export const invoiceOrderSchema = z.object({
  orderId: uuid,
  scope: z.enum(['client', 'talent']),
  talentId: uuid.nullable(),
});
export type InvoiceOrderInput = z.infer<typeof invoiceOrderSchema>;

// ── Activity ────────────────────────────────────────────────

export const addOrderActivityNoteSchema = z.object({
  orderId: uuid,
  body: z.string().min(1).max(5000),
});
export type AddOrderActivityNoteInput = z.infer<typeof addOrderActivityNoteSchema>;
