export type MovementCsvInput = {
  concept: string;
  amount: unknown;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  user: { name: string | null; email: string } | null;
};

export const generateMovementsCsv = (
  movements: MovementCsvInput[]
): string => {
  const header = ['concept', 'amount', 'date', 'type', 'username'];

  const rows = movements.map((movement) => {
    const concept = movement.concept.replace(/"/g, '""');
    const amount = Number(movement.amount).toString();
    const date = movement.date.toISOString();
    const type = movement.type;
    const username =
      movement.user?.name ?? movement.user?.email ?? 'Unknown User';

    return [concept, amount, date, type, username]
      .map((value) => `"${value}` + '"')
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
};
