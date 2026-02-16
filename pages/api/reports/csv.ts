import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { withRole, type AuthenticatedRequest } from '@/lib/auth';
import { generateMovementsCsv } from '@/lib/csv';

/**
 * @swagger
 * /api/reports/csv:
 *   get:
 *     summary: Exportar movimientos a CSV
 *     description: Descarga los movimientos en formato CSV (máximo 10,000 registros más recientes). Solo disponible para administradores.
 *     tags:
 *       - Reports
 *     responses:
 *       200:
 *         description: Archivo CSV con todos los movimientos.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               ID,Concepto,Monto,Tipo,Fecha,Usuario
 *               123,Pago salario,1500.50,INCOME,2025-01-15,user@example.com
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
  // Límite de 10,000 registros para prevenir timeouts y problemas de memoria
  const MAX_CSV_RECORDS = 10000;

  const movements = await prisma.movement.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: MAX_CSV_RECORDS,
  });

  const csvContent = generateMovementsCsv(movements);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="movements-report.csv"'
  );

  res.status(200).send(csvContent);
};

export default withRole('ADMIN', handler);
