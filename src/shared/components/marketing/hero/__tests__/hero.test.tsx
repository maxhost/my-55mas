import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Hero } from '../hero';

const IMAGE = { type: 'image' as const, src: '/img.jpg', alt: 'pic' };
const VIDEO = {
  type: 'video' as const,
  src: 'https://player.vimeo.com/video/1',
  title: 'video',
};

describe('Hero', () => {
  afterEach(() => cleanup());

  it('renders title parts and lead', () => {
    render(
      <Hero
        titleBefore="55+:"
        titleAccent="La Revolución"
        titleAfter="de la experiencia"
        lead="Lead text"
        media={IMAGE}
      />,
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('55+: La Revolución de la experiencia');
    expect(screen.getByText('Lead text')).toBeInTheDocument();
  });

  it('omits CTAs when ctas is empty or unset (backward-compat default)', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} />,
    );
    expect(container.querySelectorAll('a').length).toBe(0);
  });

  it('renders CTAs when provided', () => {
    render(
      <Hero
        titleBefore="t"
        lead="x"
        media={IMAGE}
        ctas={[
          { id: 'a', buttonLabel: 'Click', href: '/x', variant: 'mustard' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Click' })).toHaveAttribute(
      'href',
      '/x',
    );
  });

  it('applies cream background by default', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} />,
    );
    expect(container.querySelector('section')?.className).toContain(
      'bg-brand-cream',
    );
  });

  it('applies sky background when requested', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} background="sky" />,
    );
    expect(container.querySelector('section')?.className).toContain(
      'bg-brand-blue',
    );
  });

  it('keeps viewport min-height by default', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} />,
    );
    const inner = container.querySelector('section > div');
    expect(inner?.className).toContain('min-h-[calc(100vh-119px)]');
  });

  it('drops viewport min-height when compact=true', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} compact />,
    );
    const inner = container.querySelector('section > div');
    expect(inner?.className ?? '').not.toContain('min-h-[calc(100vh-119px)]');
  });

  it('renders an image figure without rounded/shadow/aspect-video chrome', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} />,
    );
    const fig = container.querySelector('figure');
    expect(fig?.className).not.toContain('bg-black');
    expect(fig?.className).not.toContain('rounded-');
    expect(fig?.className).not.toContain('shadow-');
    expect(fig?.className).not.toContain('aspect-video');
  });

  it('keeps the rounded/shadow/aspect-video frame for video media', () => {
    const { container } = render(
      <Hero titleBefore="t" lead="x" media={VIDEO} />,
    );
    const fig = container.querySelector('figure');
    expect(fig?.className).toContain('bg-black');
    expect(fig?.className).toContain('rounded-[20px]');
    expect(fig?.className).toContain('aspect-video');
  });

  it('renders HeroDecorations by default and skips them when decorations=false', () => {
    const withDeco = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} />,
    );
    expect(
      withDeco.container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(0);
    cleanup();
    const noDeco = render(
      <Hero titleBefore="t" lead="x" media={IMAGE} decorations={false} />,
    );
    expect(
      noDeco.container.querySelectorAll('[aria-hidden="true"]').length,
    ).toBe(0);
  });

  it('renders an iframe with title for video media', () => {
    render(<Hero titleBefore="t" lead="x" media={VIDEO} />);
    expect(screen.getByTitle('video').tagName).toBe('IFRAME');
  });
});
