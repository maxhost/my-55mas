import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const { mockTranslate, mockRefresh, mockToastSuccess, mockToastError } =
  vi.hoisted(() => ({
    mockTranslate: vi.fn(),
    mockRefresh: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock('../../actions/translate-service', () => ({
  translateService: (...args: unknown[]) => mockTranslate(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

import { ServiceTranslateAiButton } from '../service-translate-ai-button';
import type { ServiceTranslationDetail } from '../../types';

const FULL_ES: ServiceTranslationDetail = {
  locale: 'es',
  name: 'Acompañamiento',
  description: 'Servicio…',
  includes: null,
  hero_title: null,
  hero_subtitle: null,
  benefits: [],
  guarantees: [],
  faqs: [],
};

const EMPTY_ES: ServiceTranslationDetail = {
  ...FULL_ES,
  name: '',
  description: null,
};

const NAME_ONLY_ES: ServiceTranslationDetail = {
  ...FULL_ES,
  description: null,
};

describe('ServiceTranslateAiButton', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });
  afterEach(() => cleanup());

  it('renders the button with the IA label', () => {
    render(<ServiceTranslateAiButton serviceId="svc" esTranslation={FULL_ES} />);
    expect(screen.getByRole('button')).toHaveTextContent('aiTranslateButtonLabel');
  });

  it('disables when ES name is empty', () => {
    render(<ServiceTranslateAiButton serviceId="svc" esTranslation={EMPTY_ES} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables when ES has only name and no extra fields', () => {
    render(
      <ServiceTranslateAiButton serviceId="svc" esTranslation={NAME_ONLY_ES} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables when ES has name + at least one extra field', () => {
    render(<ServiceTranslateAiButton serviceId="svc" esTranslation={FULL_ES} />);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('shows the confirm dialog when clicked', () => {
    render(<ServiceTranslateAiButton serviceId="svc" esTranslation={FULL_ES} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('aiTranslateConfirmTitle')).toBeInTheDocument();
  });

  it('calls translateService and shows success toast on confirm', async () => {
    mockTranslate.mockResolvedValue({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    render(<ServiceTranslateAiButton serviceId="svc-123" esTranslation={FULL_ES} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('aiTranslate'));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('aiTranslateSuccess'));
    expect(mockTranslate).toHaveBeenCalledWith({
      service_id: 'svc-123',
      esTranslation: FULL_ES,
    });
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('shows error toast when translateService returns an error', async () => {
    mockTranslate.mockResolvedValue({ error: 'translate-failed' });
    render(<ServiceTranslateAiButton serviceId="svc-123" esTranslation={FULL_ES} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('aiTranslate'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('aiTranslateError'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
