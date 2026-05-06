import { renderHook } from '@testing-library/react';
import { useFilteredMovements } from '@/lib/hooks/useFilteredMovements';

describe('useFilteredMovements', () => {
  const items = [
    {
      id: '1',
      concept: 'Salary',
      amount: 1200,
      date: '2025-01-10T00:00:00.000Z',
      type: 'INCOME',
      user: { name: 'Jane', email: 'jane@example.com' },
    },
    {
      id: '2',
      concept: 'Rent',
      amount: 500,
      date: '2025-01-20T00:00:00.000Z',
      type: 'EXPENSE',
      user: { name: 'Jane', email: 'jane@example.com' },
    },
    {
      id: '3',
      concept: 'Groceries',
      amount: 80,
      date: '2025-01-15T00:00:00.000Z',
      type: 'EXPENSE',
      user: { name: 'Alex', email: 'alex@example.com' },
    },
  ];

  it('filters by search and sorts by date descending', () => {
    const { result } = renderHook(() =>
      useFilteredMovements(items, 'Jane', 'ALL', 'date', 'desc')
    );

    expect(result.current.map((item) => item.id)).toEqual(['2', '1']);
  });

  it('filters by type and sorts by amount ascending', () => {
    const { result } = renderHook(() =>
      useFilteredMovements(items, '', 'EXPENSE', 'amount', 'asc')
    );

    expect(result.current.map((item) => item.id)).toEqual(['3', '2']);
  });

  it('falls back to concept sorting and reverses for desc', () => {
    const { result } = renderHook(() =>
      useFilteredMovements(items, '', 'ALL', 'concept', 'desc')
    );

    expect(result.current.map((item) => item.concept)).toEqual([
      'Salary',
      'Rent',
      'Groceries',
    ]);
  });

  it('uses user email when user name is null', () => {
    const withMissingName = [
      ...items,
      {
        id: '4',
        concept: 'Refund',
        amount: 20,
        date: '2025-01-11T00:00:00.000Z',
        type: 'INCOME',
        user: { name: null, email: 'fallback@example.com' },
      },
    ];

    const { result } = renderHook(() =>
      useFilteredMovements(withMissingName, 'fallback@example.com', 'ALL', 'date', 'asc')
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('4');
  });
});
