import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Identity mock: render next-intl `Link` as a plain `<a>` so jsdom
// doesn't need a locale provider and `href` asserts keep working.
vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === 'string' ? href : ''} {...rest}>{children}</a>
  ),
}));

import { FeatureRow } from '../feature-row';

const IMAGE = {
  type: 'image' as const,
  src: '/img.jpg',
  alt: 'pic',
  width: 600,
  height: 400,
};
const VIDEO = {
  type: 'video' as const,
  src: 'https://player.vimeo.com/video/123',
  title: 'A video',
};

describe('FeatureRow', () => {
  afterEach(() => cleanup());

  it('renders title + lead alongside an image', () => {
    render(<FeatureRow title="Protagonistas" lead="Lead text" media={IMAGE} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Protagonistas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Lead text')).toBeInTheDocument();
    expect(screen.getByAltText('pic')).toBeInTheDocument();
  });

  it('renders without a lead when not provided', () => {
    render(<FeatureRow title="Just title" media={IMAGE} />);
    expect(
      screen.getByRole('heading', { name: 'Just title' }),
    ).toBeInTheDocument();
  });

  it('renders a video iframe when media.type=video', () => {
    render(<FeatureRow title="Vid" media={VIDEO} />);
    const iframe = screen.getByTitle('A video');
    expect(iframe.tagName).toBe('IFRAME');
  });

  it('renders bullets as a check-bulleted list', () => {
    render(
      <FeatureRow title="Bullets" media={IMAGE} bullets={['a', 'b', 'c']} />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('omits the bullets list when array is empty', () => {
    const { container } = render(
      <FeatureRow title="None" media={IMAGE} bullets={[]} />,
    );
    expect(container.querySelector('ul')).toBeNull();
  });

  it('reverses column order when reversed=true', () => {
    const { container } = render(
      <FeatureRow title="x" media={IMAGE} reversed />,
    );
    const fig = container.querySelector('figure');
    expect(fig?.className).toContain('md:order-2');
  });

  it('does not reverse by default', () => {
    const { container } = render(<FeatureRow title="x" media={IMAGE} />);
    const fig = container.querySelector('figure');
    expect(fig?.className ?? '').not.toContain('md:order-2');
  });

  it('renders decorative donut SVG when shapeVariant="about"', () => {
    const { container } = render(
      <FeatureRow title="x" media={IMAGE} shapeVariant="about" />,
    );
    const shape = container.querySelector('img[aria-hidden="true"]');
    expect(shape).not.toBeNull();
    expect(shape?.getAttribute('src')).toContain('Vector.svg');
  });

  it('omits decorative shapes by default', () => {
    const { container } = render(<FeatureRow title="x" media={IMAGE} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders a CTA link when cta is provided', () => {
    render(
      <FeatureRow
        title="x"
        media={IMAGE}
        cta={{ label: 'Join now', href: '/join' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Join now' })).toHaveAttribute(
      'href',
      '/join',
    );
  });

  it('omits the CTA when not provided', () => {
    const { container } = render(<FeatureRow title="x" media={IMAGE} />);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('applies coral variant class when requested', () => {
    render(
      <FeatureRow
        title="x"
        media={IMAGE}
        cta={{ label: 'Go', href: '/go', variant: 'coral' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Go' }).className).toContain(
      'bg-brand-coral',
    );
  });

  it('uses white background by default and cream when requested', () => {
    const white = render(<FeatureRow title="x" media={IMAGE} />)
      .container.querySelector('section');
    expect(white?.className).toContain('bg-white');
    cleanup();
    const cream = render(<FeatureRow title="x" media={IMAGE} background="cream" />)
      .container.querySelector('section');
    expect(cream?.className).toContain('bg-brand-cream');
  });
});
