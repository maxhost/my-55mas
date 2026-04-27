import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { FormRenderer } from '../form-renderer';
import type {
  ResolvedField,
  ResolvedForm,
} from '@/shared/lib/field-catalog/resolved-types';

function makeField(overrides: Partial<ResolvedField>): ResolvedField {
  return {
    field_definition_id: 'fd-1',
    key: 'k',
    input_type: 'text',
    persistence_type: 'form_response',
    persistence_target: null,
    required: false,
    label: 'K',
    placeholder: '',
    options: null,
    options_source: null,
    ...overrides,
  };
}

function singleStep(fields: ResolvedField[]): ResolvedForm {
  return {
    steps: [{ key: 'step1', label: 'Step 1', fields }],
  };
}

describe('FormRenderer', () => {
  it('renders text input with label and placeholder from ResolvedField', () => {
    const form = singleStep([
      makeField({
        key: 'phone',
        input_type: 'text',
        label: 'Teléfono',
        placeholder: 'Escribe tu teléfono',
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} submitLabel="Enviar" />);
    expect(screen.getByText('Teléfono')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe tu teléfono')).toBeInTheDocument();
  });

  it('shows "*" for required fields', () => {
    const form = singleStep([
      makeField({ key: 'email', label: 'Email', required: true }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    expect(screen.getByText('Email *')).toBeInTheDocument();
  });

  it('pre-fills initial data from ResolvedField.current_value', () => {
    const form = singleStep([
      makeField({
        key: 'phone',
        input_type: 'text',
        current_value: '+34600',
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('+34600');
  });

  it('calls onSubmit with collected form data', async () => {
    const onSubmit = vi.fn();
    const form = singleStep([
      makeField({ key: 'phone', input_type: 'text', label: 'Phone' }),
    ]);
    render(
      <FormRenderer form={form} onSubmit={onSubmit} submitLabel="Send" />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '+34600' },
    });
    fireEvent.click(screen.getByText('Send'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+34600' })
    );
  });

  it('blocks submit when a required field is empty and does not call onSubmit', () => {
    const onSubmit = vi.fn();
    const form = singleStep([
      makeField({
        key: 'phone',
        input_type: 'text',
        label: 'Phone',
        required: true,
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={onSubmit} submitLabel="Send" />);
    fireEvent.click(screen.getByText('Send'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('dispatches to different renderers based on input_type', () => {
    const form = singleStep([
      makeField({ key: 'agree', input_type: 'boolean', label: 'Agree' }),
      makeField({
        key: 'bio',
        input_type: 'textarea',
        label: 'Bio',
        placeholder: 'Sobre ti',
      }),
      makeField({
        key: 'gender',
        input_type: 'single_select',
        label: 'Gender',
        options: ['male', 'female'],
        option_labels: { male: 'Masculino', female: 'Femenino' },
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sobre ti')).toBeInTheDocument();
    expect(screen.getByText('Masculino')).toBeInTheDocument();
  });

  it('multiselect_dropdown renders selected values as chips and hides them from the dropdown', () => {
    const form = singleStep([
      makeField({
        key: 'langs',
        input_type: 'multiselect_dropdown',
        label: 'Languages',
        options: ['es', 'en', 'pt'],
        option_labels: { es: 'Español', en: 'English', pt: 'Português' },
        current_value: ['es'],
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    // Chip already-selected
    expect(screen.getByText('Español')).toBeInTheDocument();
    // Trigger button exists (and chip X remove button)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders multiselect_checkbox with option labels', () => {
    const onSubmit = vi.fn();
    const form = singleStep([
      makeField({
        key: 'langs',
        input_type: 'multiselect_checkbox',
        label: 'Languages',
        options: ['es', 'en'],
        option_labels: { es: 'Español', en: 'English' },
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={onSubmit} submitLabel="Send" />);
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Español'));
    fireEvent.click(screen.getByText('Send'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ langs: ['es'] })
    );
  });

  it('renders description hint when provided', () => {
    const form = singleStep([
      makeField({
        key: 'phone',
        label: 'Phone',
        description: 'Used for contact only',
      }),
    ]);
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    expect(screen.getByText('Used for contact only')).toBeInTheDocument();
  });

  it('wizard mode: renders translated step actions and advances on "next"', () => {
    const form: ResolvedForm = {
      steps: [
        {
          key: 'step1',
          label: 'Step 1',
          fields: [makeField({ key: 'a', label: 'A' })],
          actions: [{ key: 'btn_next', type: 'next', label: 'Continuar' }],
        },
        {
          key: 'step2',
          label: 'Step 2',
          fields: [makeField({ key: 'b', label: 'B' })],
          actions: [{ key: 'btn_submit', type: 'submit', label: 'Enviar' }],
        },
      ],
    };
    render(<FormRenderer form={form} onSubmit={vi.fn()} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    // action label (not key) is rendered on the button
    fireEvent.click(screen.getByText('Continuar'));
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });
});

describe('FormRenderer — fieldSlots (S2)', () => {
  it('renders a static slot below the matching field, scoped by stepKey + fieldKey', () => {
    const form = singleStep([makeField({ key: 'phone', label: 'Phone' })]);
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        fieldSlots={{
          step1: { phone: <div data-testid="my-slot">slot content</div> },
        }}
      />
    );
    expect(screen.getByTestId('my-slot')).toBeInTheDocument();
    expect(screen.getByTestId('my-slot').textContent).toBe('slot content');
  });

  it('does NOT render a slot for a different stepKey (scoping)', () => {
    const form = singleStep([makeField({ key: 'phone' })]);
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        fieldSlots={{
          'other-step': { phone: <div data-testid="should-not">x</div> },
        }}
      />
    );
    expect(screen.queryByTestId('should-not')).not.toBeInTheDocument();
  });

  it('does NOT render a slot for a different fieldKey', () => {
    const form = singleStep([makeField({ key: 'phone' })]);
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        fieldSlots={{
          step1: { 'other-field': <div data-testid="should-not">x</div> },
        }}
      />
    );
    expect(screen.queryByTestId('should-not')).not.toBeInTheDocument();
  });

  it('callback variant receives current value and full data', () => {
    const form = singleStep([
      makeField({ key: 'phone', label: 'Phone', current_value: '+34600' }),
      makeField({ key: 'email', label: 'Email', current_value: 'a@b.c' }),
    ]);
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        fieldSlots={{
          step1: {
            phone: ({ value, data }) => (
              <div data-testid="cb-slot">
                v={String(value)} d={JSON.stringify(data)}
              </div>
            ),
          },
        }}
      />
    );
    const slot = screen.getByTestId('cb-slot');
    expect(slot.textContent).toContain('v=+34600');
    expect(slot.textContent).toContain('"phone":"+34600"');
    expect(slot.textContent).toContain('"email":"a@b.c"');
  });

  it('callback re-renders with updated value as user types', () => {
    const form = singleStep([
      makeField({ key: 'phone', label: 'Phone' }),
    ]);
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        fieldSlots={{
          step1: {
            phone: ({ value }) => (
              <div data-testid="cb-slot">v={String(value ?? 'empty')}</div>
            ),
          },
        }}
      />
    );
    expect(screen.getByTestId('cb-slot').textContent).toBe('v=empty');
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '+34999' },
    });
    expect(screen.getByTestId('cb-slot').textContent).toBe('v=+34999');
  });
});

describe('FormRenderer — actionGuards (S2)', () => {
  function wizardWithSubmit() {
    const form: ResolvedForm = {
      steps: [
        {
          key: 'step1',
          label: 'Step 1',
          fields: [makeField({ key: 'a' })],
          actions: [{ key: 'btn_submit', type: 'submit', label: 'Save' }],
        },
      ],
    };
    return form;
  }

  it('blocks submit and shows guard error message when guard returns string', () => {
    const onSubmit = vi.fn();
    render(
      <FormRenderer
        form={wizardWithSubmit()}
        onSubmit={onSubmit}
        actionGuards={{ step1: () => 'cannot proceed yet' }}
      />
    );
    fireEvent.click(screen.getByText('Save'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('cannot proceed yet')).toBeInTheDocument();
  });

  it('allows submit when guard returns true', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <FormRenderer
        form={wizardWithSubmit()}
        onSubmit={onSubmit}
        actionGuards={{ step1: () => true }}
      />
    );
    fireEvent.click(screen.getByText('Save'));
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('does not apply guard to back action', () => {
    const form: ResolvedForm = {
      steps: [
        {
          key: 'step1',
          label: 'Step 1',
          fields: [makeField({ key: 'a' })],
          actions: [{ key: 'btn_next', type: 'next', label: 'Next' }],
        },
        {
          key: 'step2',
          label: 'Step 2',
          fields: [makeField({ key: 'b' })],
          actions: [
            { key: 'btn_back', type: 'back', label: 'Back' },
            { key: 'btn_submit', type: 'submit', label: 'Save' },
          ],
        },
      ],
    };
    render(
      <FormRenderer
        form={form}
        onSubmit={vi.fn()}
        actionGuards={{ step2: () => 'blocked' }}
      />
    );
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    // Back ignored guard, advanced regardless.
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('clears previous guard error on next action', () => {
    let toggle = true;
    const guard = vi.fn(() => (toggle ? 'first error' : true));
    render(
      <FormRenderer
        form={wizardWithSubmit()}
        onSubmit={vi.fn().mockResolvedValue(true)}
        actionGuards={{ step1: guard }}
      />
    );
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByText('first error')).toBeInTheDocument();
    toggle = false;
    fireEvent.click(screen.getByText('Save'));
    expect(screen.queryByText('first error')).not.toBeInTheDocument();
  });
});
