export type MovementCsvInput = {
  concept: string;
  amount: unknown;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  user: { name: string | null; email: string } | null;
};

export const generateMovementsCsv = (movements: MovementCsvInput[]): string => {
  const header = ['concept', 'amount', 'date', 'type', 'username'];

  const rows = movements.map(
    ({ concept, amount, date, type, user }: MovementCsvInput) => {
      const safeConcept = concept.replace(/"/g, '""');
      const normalizedAmount = Number(amount).toString();
      const isoDate = date.toISOString();
      const username = user?.name ?? user?.email ?? 'Unknown User';

      return [safeConcept, normalizedAmount, isoDate, type, username]
        .map((value) => `"${value}` + '"')
        .join(',');
    }
  );

  return [header.join(','), ...rows].join('\n');
};
