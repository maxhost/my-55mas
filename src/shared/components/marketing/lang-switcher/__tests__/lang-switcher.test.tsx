import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const replace = vi.fn();

vi.mock('next-intl', () => ({ useLocale: () => 'es' }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('cat=accompaniment'),
}));
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/servicios',
}));

import { LangSwitcher } from '../lang-switcher';

describe('LangSwitcher', () => {
  beforeEach(() => replace.mockReset());
  afterEach(() => cleanup());

  it('renders the trigger with the current locale native name', () => {
    render(<LangSwitcher />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveTextContent('Español');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the listbox with all 5 locale options', () => {
    render(<LangSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(5);
    expect(opts.map((o) => o.textContent)).toEqual([
      'Español',
      'English',
      'Português',
      'Français',
      'Català',
    ]);
  });

  it('marks the current locale option as aria-selected', () => {
    render(<LangSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    const active = screen.getByRole('option', { selected: true });
    expect(active).toHaveTextContent('Español');
  });

  it('preserves searchParams when switching locale', () => {
    render(<LangSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'English' }));
    expect(replace).toHaveBeenCalledWith(
      '/servicios?cat=accompaniment',
      { locale: 'en' },
    );
  });

  it('does not navigate when clicking the already-active locale', () => {
    render(<LangSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Español' }));
    expect(replace).not.toHaveBeenCalled();
  });
});
