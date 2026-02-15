export type MovementCsvInput = {
  concept: string;
  amount: unknown;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  user: { name: string | null; email: string } | null;
};

/**
 * Sanitiza un valor para prevenir inyección CSV
 * Los caracteres =, +, -, @, |, % al inicio pueden ser interpretados como fórmulas
 */
const sanitizeCsvValue = (value: string): string => {
  if (!value) return value;

  const dangerousChars = ['=', '+', '-', '@', '|', '%'];
  const firstChar = value.charAt(0);

  if (dangerousChars.includes(firstChar)) {
    // Prefijar con comilla simple para que Excel lo trate como texto
    return `'${value}`;
  }

  return value;
};

export const generateMovementsCsv = (movements: MovementCsvInput[]): string => {
  const header = ['concept', 'amount', 'date', 'type', 'username'];

  const rows = movements.map(
    ({ concept, amount, date, type, user }: MovementCsvInput) => {
      const normalizedAmount = Number(amount).toString();
      const isoDate = date.toISOString();
      const username = user?.name ?? user?.email ?? 'Unknown User';

      return [
        sanitizeCsvValue(concept),
        normalizedAmount,
        isoDate,
        type,
        sanitizeCsvValue(username),
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',');
    }
  );

  return [header.join(','), ...rows].join('\n');
};
