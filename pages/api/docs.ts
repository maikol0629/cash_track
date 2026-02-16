import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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
  try {
    const filePath = path.join(process.cwd(), 'public', 'openapi.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const spec = JSON.parse(fileContents);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(spec);
  } catch {
    res.status(500).json({
      message: 'OpenAPI spec no disponible. Ejecuta el build primero.',
    });
  }
}
