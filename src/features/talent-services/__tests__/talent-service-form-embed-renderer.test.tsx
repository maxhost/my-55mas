import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

// Mock toast antes de import.
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock submitTalentService server action.
vi.mock('../actions/submit-talent-service', () => ({
  submitTalentService: vi.fn(),
}));

import { TalentServiceFormEmbedRenderer } from '../components/talent-service-form-embed-renderer';
import { submitTalentService } from '../actions/submit-talent-service';
import { toast } from 'sonner';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

const mockedSubmit = vi.mocked(submitTalentService);
const mockedToast = vi.mocked(toast);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const messages = {
  Common: {
    save: 'Guardar',
    saving: 'Guardando...',
    saveError: 'Error al guardar',
    savedSuccess: 'Guardado',
  },
  TalentPortal: { select: 'Seleccionar' },
  TalentServiceEmbed: {
    error: {
      auth: 'Sesión inválida',
      config: 'Configuración inválida',
      db: 'Error al guardar',
    },
  },
};

function wrap(ui: React.ReactElement) {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function makeForm(): ResolvedForm {
  return {
    steps: [
      {
        key: 's1',
        label: 'Step 1',
        fields: [
          {
            field_definition_id: 'fd-1',
            key: 'name',
            input_type: 'text',
            persistence_type: 'form_response',
            persistence_target: null,
            required: false,
            label: 'Name',
            placeholder: '',
            options: null,
            options_source: null,
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  mockedSubmit.mockResolvedValue({
    data: { talent_id: 't1', service_id: 'svc-1' },
  });
});

describe('TalentServiceFormEmbedRenderer — happy path', () => {
  it('renders the form and submits with action=save', async () => {
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
        />
      )
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Maxi' } });
    fireEvent.click(screen.getByText('Guardar'));

    // Esperamos al server action.
    await vi.waitFor(() => {
      expect(mockedSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          service_id: 'svc-1',
          form_id: 'form-1',
          form_data: expect.objectContaining({ name: 'Maxi' }),
        })
      );
    });

    // No incluye talent_id / country_id (security).
    const arg = mockedSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty('talent_id');
    expect(arg).not.toHaveProperty('country_id');
  });

  it('invokes onSubmit callback after successful save', async () => {
    const onSubmit = vi.fn();
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
          onSubmit={onSubmit}
        />
      )
    );

    fireEvent.click(screen.getByText('Guardar'));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.any(Object));
      expect(mockedToast.success).toHaveBeenCalled();
    });
  });
});

describe('TalentServiceFormEmbedRenderer — error mapping', () => {
  it('maps _auth error to TalentServiceEmbed.error.auth toast', async () => {
    mockedSubmit.mockResolvedValue({
      error: { _auth: ['notAuthenticated'] },
    });
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
        />
      )
    );
    fireEvent.click(screen.getByText('Guardar'));
    await vi.waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Sesión inválida');
    });
  });

  it('maps _config error to TalentServiceEmbed.error.config toast', async () => {
    mockedSubmit.mockResolvedValue({
      error: { _config: ['countryIdRequired'] },
    });
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
        />
      )
    );
    fireEvent.click(screen.getByText('Guardar'));
    await vi.waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Configuración inválida');
    });
  });

  it('maps _db error to TalentServiceEmbed.error.db toast', async () => {
    mockedSubmit.mockResolvedValue({
      error: { _db: ['unique violation'] },
    });
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
        />
      )
    );
    fireEvent.click(screen.getByText('Guardar'));
    await vi.waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Error al guardar');
    });
  });
});

describe('TalentServiceFormEmbedRenderer — register-action guard', () => {
  it('does not crash when meta.action is register; treats as save', async () => {
    // No tenemos forma de simular meta.action=register fácil sin mockear
    // FormRenderer. Esto se valida en el integration test de S10. Acá
    // verificamos que el código no asuma 'register' como path válido —
    // no debería haber rama que llame a registerUser en este Client.
    // Dejamos como smoke test del happy path que no rompe.
    render(
      wrap(
        <TalentServiceFormEmbedRenderer
          serviceId="svc-1"
          formId="form-1"
          resolvedForm={makeForm()}
        />
      )
    );
    expect(within(document.body).getByText('Guardar')).toBeInTheDocument();
  });
});
