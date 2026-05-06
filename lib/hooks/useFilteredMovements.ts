import { useMemo } from 'react';

export const useFilteredMovements = (
  items: any[],
  search: string,
  typeFilter: string,
  sortField: string,
  sortDirection: 'asc' | 'desc'
) => {
  return useMemo(() => {
    const term = search.toLowerCase();

    let result = items.filter((m) => {
      const name = (m.user.name ?? m.user.email).toLowerCase();

      const matchesSearch =
        m.concept.toLowerCase().includes(term) ||
        name.includes(term);

      const matchesType =
        typeFilter === 'ALL' || m.type === typeFilter;

      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      if (sortField === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortField === 'amount') {
        return a.amount - b.amount;
      }
      return a.concept.localeCompare(b.concept);
    });

    return sortDirection === 'asc' ? result : result.reverse();
  }, [items, search, typeFilter, sortField, sortDirection]);
};