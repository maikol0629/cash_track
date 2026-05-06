import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders a default button with the expected attributes', () => {
    render(<Button>Primary</Button>);

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('bg-primary');
  });

  it('applies outline and small size variants', () => {
    render(
      <Button variant='outline' size='sm'>
        Outline
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Outline' });

    expect(button).toHaveClass('border');
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('px-3');
  });

  it('applies ghost variant and custom className', () => {
    render(
      <Button variant='ghost' className='custom-class'>
        Ghost
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Ghost' });

    expect(button).toHaveClass('hover:bg-accent');
    expect(button).toHaveClass('custom-class');
  });

  it('respects the disabled state', () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
