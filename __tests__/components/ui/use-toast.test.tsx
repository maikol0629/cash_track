import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@/__tests__/test-utils/render';
import { ToastProvider, useToast } from '@/components/ui/use-toast';

const ToastConsumer = () => {
  const { toasts, showToast } = useToast();

  return (
    <div>
      <div data-testid='count'>{toasts.length}</div>
      <button
        type='button'
        onClick={() =>
          showToast({
            title: 'Created',
            description: 'Toast visible',
            variant: 'success',
          })
        }
      >
        Add toast
      </button>
      {toasts.map((toast) => (
        <div key={toast.id}>{toast.title}</div>
      ))}
    </div>
  );
};

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('throws when used outside the provider', () => {
    const BrokenConsumer = () => {
      useToast();
      return null;
    };

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useToast must be used within a ToastProvider'
    );

    consoleError.mockRestore();
  });

  it('adds and removes toasts after the timeout', async () => {
    renderWithProviders(<ToastConsumer />);

    fireEvent.click(screen.getByRole('button', { name: 'Add toast' }));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByText('Created')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.queryByText('Created')).not.toBeInTheDocument();
  });

  it('renders the provider children unchanged when no toasts exist', () => {
    render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
