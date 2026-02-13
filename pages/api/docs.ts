import type { NextApiRequest, NextApiResponse } from 'next';
import { swaggerSpec } from '@/lib/swagger';

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse
): void {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(swaggerSpec);
}
