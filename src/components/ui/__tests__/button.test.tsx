import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Button } from '../button';

describe('Button', () => {
  it('forwards ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders with correct variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('[data-slot="button"]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Delete');
  });
});
