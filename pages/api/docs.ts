import type { NextApiRequest, NextApiResponse } from 'next';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Obtener especificación OpenAPI
 *     description: Devuelve el documento OpenAPI generado a partir de las anotaciones Swagger de la API.
 *     tags:
 *       - Docs
 *     responses:
 *       200:
 *         description: Especificación OpenAPI en formato JSON.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Objeto de especificación OpenAPI 3.0.
 */
export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse
): void {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(swaggerSpec);
}
