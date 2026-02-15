import { generateMovementsCsv, type MovementCsvInput } from '@/lib/csv';

describe('generateMovementsCsv', () => {
  it('generates CSV with correct header and rows', () => {
    const movements: MovementCsvInput[] = [
      {
        concept: 'Salary',
        amount: 1000,
        date: new Date('2025-01-01T00:00:00.000Z'),
        type: 'INCOME',
        user: { name: 'Alice', email: 'alice@example.com' },
      },
      {
        concept: 'Rent',
        amount: 500,
        date: new Date('2025-01-02T00:00:00.000Z'),
        type: 'EXPENSE',
        user: { name: null, email: 'landlord@example.com' },
      },
    ];

    const csv = generateMovementsCsv(movements);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('concept,amount,date,type,username');
    expect(lines).toHaveLength(3);

    expect(lines[1]).toContain('"Salary"');
    expect(lines[1]).toContain('"1000"');
    expect(lines[1]).toContain('"INCOME"');
    expect(lines[1]).toContain('"Alice"');

    expect(lines[2]).toContain('"Rent"');
    expect(lines[2]).toContain('"500"');
    expect(lines[2]).toContain('"EXPENSE"');
    expect(lines[2]).toContain('"landlord@example.com"');
  });

  it('escapes quotes in concept and uses fallback username', () => {
    const movements: MovementCsvInput[] = [
      {
        concept: 'Bonus "Q1"',
        amount: 250,
        date: new Date('2025-03-01T00:00:00.000Z'),
        type: 'INCOME',
        user: null,
      },
    ];

    const csv = generateMovementsCsv(movements);
    const [, row] = csv.split('\n');

    // Concept should have quotes escaped inside CSV cell
    expect(row).toContain('"Bonus ""Q1"""');
    // Username should fall back to "Unknown User"
    expect(row).toContain('"Unknown User"');
  });

  it('sanitizes CSV injection attempts with formula characters', () => {
    const movements: MovementCsvInput[] = [
      {
        concept: '=1+1',
        amount: 100,
        date: new Date('2025-01-01T00:00:00.000Z'),
        type: 'INCOME',
        user: { name: '@SUM(A1:A10)', email: 'test@example.com' },
      },
      {
        concept: '+cmd|calc',
        amount: 200,
        date: new Date('2025-01-02T00:00:00.000Z'),
        type: 'EXPENSE',
        user: { name: '-2+5', email: 'user@example.com' },
      },
    ];

    const csv = generateMovementsCsv(movements);
    const lines = csv.split('\n');

    // Formulas should be prefixed with single quote
    expect(lines[1]).toContain('"\'=1+1"');
    expect(lines[1]).toContain('"\'@SUM(A1:A10)"');
    expect(lines[2]).toContain('"\'+cmd|calc"');
    expect(lines[2]).toContain('"\'-2+5"');
  });

  it('does not modify safe values without dangerous characters', () => {
    const movements: MovementCsvInput[] = [
      {
        concept: 'Normal Salary',
        amount: 1000,
        date: new Date('2025-01-01T00:00:00.000Z'),
        type: 'INCOME',
        user: { name: 'John Doe', email: 'john@example.com' },
      },
    ];

    const csv = generateMovementsCsv(movements);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('"Normal Salary"');
    expect(lines[1]).toContain('"John Doe"');
    expect(lines[1]).not.toContain("'Normal");
    expect(lines[1]).not.toContain("'John");
  });
});
