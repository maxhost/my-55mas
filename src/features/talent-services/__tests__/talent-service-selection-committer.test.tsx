import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions/commit-talent-service-selection', () => ({
  commitTalentServiceSelection: vi.fn(),
}));

import { TalentServiceSelectionCommitter } from '../components/talent-service-selection-committer';
import { commitTalentServiceSelection } from '../actions/commit-talent-service-selection';
import { toast } from 'sonner';

const mockedCommit = vi.mocked(commitTalentServiceSelection);
const mockedToast = vi.mocked(toast);

const messages = {
  OnboardingServices: {
    commitSelection: 'Aplicar selección',
    commitPending: 'Cambios pendientes',
    commitInFlight: 'Aplicando…',
    commitSuccess: 'Selección aplicada',
    commitError: 'No se pudo aplicar',
  },
};

function wrap(ui: React.ReactElement) {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('TalentServiceSelectionCommitter', () => {
  it('button disabled when current === persisted (no diff)', () => {
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['A', 'B']}
          persistedSelection={['A', 'B']}
        />
      )
    );
    const btn = screen.getByText('Aplicar selección');
    expect(btn).toBeDisabled();
    // Sin pending message cuando no hay diff.
    expect(screen.queryByText('Cambios pendientes')).not.toBeInTheDocument();
  });

  it('button disabled regardless of order (sorted comparison)', () => {
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['B', 'A']}
          persistedSelection={['A', 'B']}
        />
      )
    );
    const btn = screen.getByText('Aplicar selección');
    expect(btn).toBeDisabled();
  });

  it('button enabled when current differs from persisted (added)', () => {
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['A', 'B', 'C']}
          persistedSelection={['A', 'B']}
        />
      )
    );
    expect(screen.getByText('Aplicar selección')).not.toBeDisabled();
    expect(screen.getByText('Cambios pendientes')).toBeInTheDocument();
  });

  it('button enabled when current differs from persisted (removed)', () => {
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['A']}
          persistedSelection={['A', 'B']}
        />
      )
    );
    expect(screen.getByText('Aplicar selección')).not.toBeDisabled();
  });

  it('clicking dispatches commit with current selection', async () => {
    mockedCommit.mockResolvedValue({ data: { count: 2 } });
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['A', 'C']}
          persistedSelection={['A', 'B']}
        />
      )
    );
    fireEvent.click(screen.getByText('Aplicar selección'));
    await vi.waitFor(() => {
      expect(mockedCommit).toHaveBeenCalledWith({ serviceIds: ['A', 'C'] });
      expect(mockedToast.success).toHaveBeenCalledWith('Selección aplicada');
    });
  });

  it('shows error toast on server error', async () => {
    mockedCommit.mockResolvedValue({
      error: { _config: ['serviceNotAvailable'] },
    });
    render(
      wrap(
        <TalentServiceSelectionCommitter
          currentSelection={['A', 'X']}
          persistedSelection={['A']}
        />
      )
    );
    fireEvent.click(screen.getByText('Aplicar selección'));
    await vi.waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('No se pudo aplicar');
    });
  });
});
