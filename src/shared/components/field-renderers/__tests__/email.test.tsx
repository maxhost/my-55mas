import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { EmailAuthField } from '../email';
import type { ResolvedField } from '@/shared/lib/field-catalog/resolved-types';

afterEach(cleanup);

const messages = {
  Common: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    emailChangeDefaultTitle: 'Confirmar cambio de email',
    emailChangeDefaultBody: 'Se enviará un enlace…',
  },
};

function wrap(ui: React.ReactElement) {
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function makeField(overrides: Partial<ResolvedField> = {}): ResolvedField {
  return {
    field_definition_id: 'fd-email',
    key: 'email',
    input_type: 'email',
    persistence_type: 'auth',
    persistence_target: { auth_field: 'email' },
    required: true,
    label: 'Email',
    placeholder: '',
    options: null,
    options_source: null,
    ...overrides,
  };
}

describe('EmailAuthField — readOnly mode (allow_change !== true)', () => {
  it('renders a readOnly input with the committed email', () => {
    const field = makeField({ config: null });
    render(
      wrap(
        <EmailAuthField
          field={field}
          value="user@example.com"
          errorClass=""
          onChange={vi.fn()}
        />
      )
    );
    const input = screen.getByDisplayValue('user@example.com') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('does not call onChange even if the DOM tries to mutate', () => {
    const onChange = vi.fn();
    const field = makeField({ config: { allow_change: false } });
    render(
      wrap(
        <EmailAuthField
          field={field}
          value="user@example.com"
          errorClass=""
          onChange={onChange}
        />
      )
    );
    // readOnly inputs do not fire onChange when the user tries to type
    const input = screen.getByDisplayValue('user@example.com');
    fireEvent.change(input, { target: { value: 'other@example.com' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('EmailAuthField — editable mode (allow_change === true)', () => {
  const editableField = () =>
    makeField({
      config: { allow_change: true },
      option_labels: {
        modal_title: 'Cambiar email',
        modal_body: 'Se enviará un enlace al nuevo email.',
      },
    });

  it('allows typing without immediately committing', () => {
    const onChange = vi.fn();
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={onChange}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens the confirm dialog on blur when the typed value differs', () => {
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={vi.fn()}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.blur(input);
    expect(screen.getByText('Cambiar email')).toBeInTheDocument();
    expect(
      screen.getByText('Se enviará un enlace al nuevo email.')
    ).toBeInTheDocument();
  });

  it('does not open the dialog when the typed value is unchanged', () => {
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={vi.fn()}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com');
    fireEvent.blur(input);
    expect(screen.queryByText('Cambiar email')).not.toBeInTheDocument();
  });

  it('does not open the dialog when the typed value is blank (reverts)', () => {
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={vi.fn()}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(screen.queryByText('Cambiar email')).not.toBeInTheDocument();
    expect(input.value).toBe('old@example.com');
  });

  it('calls onChange with the new email when Confirm is clicked', () => {
    const onChange = vi.fn();
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={onChange}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.blur(input);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Confirmar'));
    expect(onChange).toHaveBeenCalledWith('email', 'new@example.com');
  });

  it('falls back to Common.emailChangeDefault* when option_labels are missing', () => {
    const field = makeField({
      config: { allow_change: true },
      option_labels: {},
    });
    render(
      wrap(
        <EmailAuthField
          field={field}
          value="old@example.com"
          errorClass=""
          onChange={vi.fn()}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com');
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.blur(input);
    expect(screen.getByText('Confirmar cambio de email')).toBeInTheDocument();
    expect(screen.getByText('Se enviará un enlace…')).toBeInTheDocument();
  });

  it('reverts the input and does not call onChange when Cancel is clicked', () => {
    const onChange = vi.fn();
    render(
      wrap(
        <EmailAuthField
          field={editableField()}
          value="old@example.com"
          errorClass=""
          onChange={onChange}
        />
      )
    );
    const input = screen.getByDisplayValue('old@example.com') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    fireEvent.blur(input);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Cancelar'));
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('old@example.com');
  });
});
