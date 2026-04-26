// Mapea el string de error del save-field-definition action a una clave
// i18n del namespace AdminFieldCatalog.errors. Heurística por substrings
// porque los mensajes de Zod vienen concatenados (ej. "translations.es.label: missingLabel").
export function mapFieldDefinitionErrorKey(error: string): string {
  if (error === 'duplicateKey') return 'duplicateKey';
  if (error === 'groupNotFound') return 'groupNotFound';
  if (error.includes('invalidKey') || error.includes('key:')) return 'invalidKey';
  if (error.includes('missingContent')) return 'missingContent';
  if (error.includes('missingTermsUrls')) return 'missingTermsUrls';
  if (error.includes('invalidUrl')) return 'invalidUrl';
  if (error.includes('allowChangeOnlyForEmailAuth'))
    return 'allowChangeOnlyForEmailAuth';
  if (error.includes('invalidAllowChange')) return 'invalidAllowChange';
  if (error.includes('missingLabel') || error.includes('translations'))
    return 'missingLabel';
  return 'saveFailed';
}
