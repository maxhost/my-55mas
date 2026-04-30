// Side-effect module: registra los field-renderers feature-specific de
// talent-services en el shared registry.
//
// Importado from `app/[locale]/layout.tsx` con un side-effect import:
//   `import '@/features/talent-services/init/register-renderers';`
//
// Esto asegura que cualquier page que use FormRenderer ya tenga el
// renderer del talent_services_panel listo en el registry.
//
// shared/ NO importa de features/. La dirección es features → shared:
// este archivo escribe al map de shared/components/field-renderers/registry.

import { registerInputRenderer } from '@/shared/components/field-renderers/registry';
import { TalentServicesPanel } from '../components/field-renderers/talent-services-panel';

// Idempotente: si por algún motivo este módulo se evalúa dos veces (HMR,
// múltiples entry points), saltar el doble registro.
import { inputRenderers } from '@/shared/components/field-renderers/registry';
if (!inputRenderers.has('talent_services_panel')) {
  registerInputRenderer('talent_services_panel', (props) => (
    <TalentServicesPanel {...props} />
  ));
}
