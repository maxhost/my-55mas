// Types and contracts shared with components and routes.
export * from './types';

// Read actions.
export { getClientDetail } from './actions/get-client-detail';
export { getClientDetailsData } from './actions/get-client-details-data';
export { getClientStats } from './actions/get-client-stats';
export { getClientOrders } from './actions/get-client-orders';
export { getClientPayments } from './actions/get-client-payments';
export { getPaymentDetail } from './actions/get-payment-detail';

// Write/update actions (Phase 1: all mocked; Phase 2 will plug DB).
export { saveClientPersonalData } from './actions/save-personal-data';
export { saveClientContact } from './actions/save-contact';
export { saveClientBilling } from './actions/save-billing';
export { deleteClient } from './actions/delete-client';

// Lib helpers.
export { composeClientDetail } from './lib/compose-client-detail';

// Top-level component for the admin client detail route.
export { ClientDetailTabs } from './components/client-detail-tabs';
