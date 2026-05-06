import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dialog, DialogHeader } from '@/components/ui/dialog';

describe('Dialog', () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    onOpenChange.mockClear();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogHeader title='Hidden' />
      </Dialog>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders and closes when clicking the backdrop', () => {
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogHeader title='Visible' description='Dialog body' />
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Visible')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside the dialog content', () => {
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogHeader title='Visible' />
      </Dialog>
    );

    fireEvent.click(screen.getByText('Visible'));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
