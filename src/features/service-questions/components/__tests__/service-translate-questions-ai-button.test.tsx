import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import type { Question } from '@/shared/lib/questions/types';

const { mockTranslate, mockRefresh, mockToastSuccess, mockToastError } =
  vi.hoisted(() => ({
    mockTranslate: vi.fn(),
    mockRefresh: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
  }));

vi.mock('../../actions/translate-service-questions', () => ({
  translateServiceQuestions: (...args: unknown[]) => mockTranslate(...args),
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

import { ServiceTranslateQuestionsAiButton } from '../service-translate-questions-ai-button';

function q(key: string, esLabel: string | null): Question {
  return {
    key,
    type: 'text',
    required: false,
    i18n: esLabel === null ? {} : { es: { label: esLabel } },
  };
}

describe('ServiceTranslateQuestionsAiButton', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });
  afterEach(() => cleanup());

  it('renders with the IA label', () => {
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', 'hola')]}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent(
      'aiTranslateButtonLabel',
    );
  });

  it('disables when no question has ES label', () => {
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', null)]}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables on empty question list', () => {
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[]}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables when at least one question has ES label', () => {
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', null), q('k2', 'hola')]}
      />,
    );
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('opens the confirm dialog when clicked', () => {
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', 'hola')]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('aiTranslateConfirmTitle')).toBeInTheDocument();
  });

  it('calls translateServiceQuestions with serviceId, target and questions on confirm', async () => {
    mockTranslate.mockResolvedValue({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    const questions = [q('k1', 'hola')];
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc-123"
        target="talent"
        questions={questions}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('aiTranslate'));
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith('aiTranslateSuccess'),
    );
    expect(mockTranslate).toHaveBeenCalledWith({
      service_id: 'svc-123',
      target: 'talent',
      questions,
    });
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('shows specific toast for too-many-questions error', async () => {
    mockTranslate.mockResolvedValue({ error: 'too-many-questions' });
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', 'hola')]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('aiTranslate'));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('aiTranslateErrorTooMany'),
    );
  });

  it('shows generic error toast for other errors', async () => {
    mockTranslate.mockResolvedValue({ error: 'translate-failed' });
    render(
      <ServiceTranslateQuestionsAiButton
        serviceId="svc"
        target="client"
        questions={[q('k1', 'hola')]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('aiTranslate'));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('aiTranslateError'),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
