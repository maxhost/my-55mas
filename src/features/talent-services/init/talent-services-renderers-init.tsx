'use client';

// Client Component que registra los field-renderers feature-specific de
// talent-services en el shared registry. Al ser Client, su módulo se
// incluye en el client bundle y el side-effect register se ejecuta
// también browser-side — donde FormRenderer (también Client) hace su
// lookup.
//
// El root layout (Server Component) renderea <TalentServicesRenderersInit />.
// Eso fuerza la inclusión del módulo en el client bundle. El componente
// renderea null — solo existe por el side-effect.
//
// Architecture.md §3: app/ importa de features/ (regla "route groups
// consumen features"). features/ importa de shared/ (registry). shared/
// no importa de features/ — la regla se mantiene.

import { registerInputRenderer, inputRenderers } from '@/shared/components/field-renderers/registry';
import { TalentServicesPanel } from '../components/field-renderers/talent-services-panel';

// Side-effect register. Idempotente: chequea si ya está registrado para
// soportar HMR/multiples evaluaciones del módulo en dev. El guard del
// `registerInputRenderer` también protege contra errores explícitos.
if (!inputRenderers.has('talent_services_panel')) {
  registerInputRenderer('talent_services_panel', (props) => (
    <TalentServicesPanel {...props} />
  ));
}

export function TalentServicesRenderersInit() {
  return null;
}
