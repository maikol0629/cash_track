import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

describe('DropdownMenu', () => {
  it('toggles the menu content when the trigger is clicked', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button type='button'>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.queryByText('First item')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('closes the menu after selecting an item', () => {
    const handleClick = jest.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button type='button'>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleClick}>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('keeps a disabled item from firing and closing', () => {
    const handleClick = jest.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button type='button'>Open menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onClick={handleClick}>
            Disabled item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disabled item' }));

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByText('Disabled item')).toBeInTheDocument();
  });
});
