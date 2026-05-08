/**
 * Canonical default status values that mirror DB CHECK constraints.
 *
 * Mirrored here (instead of imported from individual feature folders) so
 * cross-feature consumers don't break the `boundaries/element-types`
 * ESLint rule. The features that own the canonical types (`OrderStatus`
 * in `features/orders/types.ts`, `TalentStatus` in `features/talents/types.ts`)
 * re-export these values for typed access within their own scope.
 *
 * Keep in sync with:
 *   - features/orders/types.ts → ORDER_STATUSES
 *   - features/talents/types.ts → TALENT_STATUSES
 *   - DB CHECK constraints `orders_status_check` and
 *     `talent_profiles_status_check`.
 */

/**
 * Status of a freshly-created order (e.g. via `/registro/contratar` or the
 * admin test hire). Anything else fails `orders_status_check`.
 */
export const INITIAL_ORDER_STATUS = 'pendiente';

/**
 * Status of a freshly-registered talent. Anything else fails
 * `talent_profiles_status_check`.
 */
export const INITIAL_TALENT_STATUS = 'registered';
