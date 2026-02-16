import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest } from '@/lib/auth';

interface MonthlyAggregate {
  month: string; // YYYY-MM
  income: number;
  expense: number;
}

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obtener reporte financiero
 *     description: Devuelve totales de ingresos, egresos, balance y agregados mensuales. Solo disponible para administradores.
 *     tags:
 *       - Reports
 *     responses:
 *       200:
 *         description: Resumen financiero.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpense:
 *                   type: number
 *                 balance:
 *                   type: number
 *                 totalMovements:
 *                   type: number
 *                   description: Número total de movimientos en la base de datos
 *                 monthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2025-01"
 *                       income:
 *                         type: number
 *                       expense:
 *                         type: number
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No autorizado, se requiere rol ADMIN.
 *       500:
 *         description: Error interno del servidor.
 */

const handler = async (
  _req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<void> => {
  // Obtiene el total de movimientos para advertencia de límite CSV
  const totalCount = await prisma.movement.count();

  // Obtiene todos los movimientos para calcular totales y agregados mensuales
  const movements = await prisma.movement.findMany({
    select: {
      amount: true,
      type: true,
      date: true,
    },
    orderBy: { date: 'asc' },
  });

  let totalIncome = 0;
  let totalExpense = 0;

  const byMonth: Record<string, { income: number; expense: number }> = {};

  // Para cada movimiento se acumulan totales globales y por mes (YYYY-MM)
  movements.forEach(
    (movement: { amount: unknown; type: 'INCOME' | 'EXPENSE'; date: Date }) => {
      const amount = Number(movement.amount);

      if (movement.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      const year = movement.date.getFullYear();
      const monthIndex = movement.date.getMonth() + 1;
      const monthKey = `${year}-${String(monthIndex).padStart(2, '0')}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { income: 0, expense: 0 };
      }

      if (movement.type === 'INCOME') {
        byMonth[monthKey].income += amount;
      } else {
        byMonth[monthKey].expense += amount;
      }
    }
  );

  // Se transforma el mapa en un arreglo ordenado por mes para enviar al frontend
  const monthly: MonthlyAggregate[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, ...value }));

  const balance = totalIncome - totalExpense;

  res.status(200).json({
    totalIncome,
    totalExpense,
    balance,
    monthly,
    totalMovements: totalCount,
  });
};

export default withRole('ADMIN', handler);
