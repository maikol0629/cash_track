import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

describe('AlertDialog', () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    onOpenChange.mockClear();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <AlertDialog open={false} onOpenChange={onOpenChange}>
        <div />
      </AlertDialog>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the content and closes from the backdrop', () => {
    render(
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item</AlertDialogTitle>
          <AlertDialogDescription>Confirm deletion</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Delete item')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close alert dialog' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders action and cancel buttons', () => {
    const handleCancel = jest.fn();
    const handleDelete = jest.fn();

    render(
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
