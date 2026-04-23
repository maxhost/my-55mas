import type { ReactNode } from 'react';
import type { RenderProps } from './shared';

// Checkbox de aceptación de términos con enlaces inline embebidos en la
// label. La label usa placeholders {tos} y {privacy} que se reemplazan
// por <a target="_blank"> con los textos de option_labels (per-locale) y
// las URLs de field.config (globales). Si una URL no está seteada, el
// placeholder se renderiza como texto plano. Si el template no tiene
// ningún placeholder, los links se appendean al final automáticamente
// (fallback robusto).
export function renderTermsCheckbox({ field, value, onChange }: RenderProps) {
  const config = (field.config ?? {}) as {
    tos_url?: string;
    privacy_url?: string;
  };
  const linkLabels = field.option_labels ?? {};
  const checked = value === true;

  const renderLinkOrText = (
    key: string,
    url: string | undefined,
    text: string
  ): ReactNode => {
    if (!text) return null;
    if (!url) return text;
    return (
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link underline hover:opacity-80"
      >
        {text}
      </a>
    );
  };

  const template = field.label || '';
  const hasTosPh = template.includes('{tos}');
  const hasPrivacyPh = template.includes('{privacy}');

  let nodes: ReactNode[];
  if (hasTosPh || hasPrivacyPh) {
    const parts = template.split(/(\{tos\}|\{privacy\})/);
    nodes = parts.map((part, i) => {
      if (part === '{tos}') {
        return renderLinkOrText(`tos-${i}`, config.tos_url, linkLabels.tos ?? '');
      }
      if (part === '{privacy}') {
        return renderLinkOrText(
          `priv-${i}`,
          config.privacy_url,
          linkLabels.privacy ?? ''
        );
      }
      return part;
    });
  } else {
    const tosNode = renderLinkOrText('tos-append', config.tos_url, linkLabels.tos ?? '');
    const privacyNode = renderLinkOrText(
      'priv-append',
      config.privacy_url,
      linkLabels.privacy ?? ''
    );
    nodes = [template];
    if (tosNode) nodes.push(' ', tosNode);
    if (tosNode && privacyNode) nodes.push(' · ');
    else if (privacyNode) nodes.push(' ');
    if (privacyNode) nodes.push(privacyNode);
  }

  return (
    <div key={field.key} className="space-y-1">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          {nodes}
          {field.required && <span aria-hidden="true"> *</span>}
        </span>
      </label>
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
    </div>
  );
}
