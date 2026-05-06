import fs from 'node:fs';
import handler from '@/pages/api/docs';
import { createMockRes } from '@/__tests__/test-utils/api';

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
}));

describe('/api/docs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the OpenAPI spec when the file exists', () => {
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({ openapi: '3.0.0' })
    );

    const req = {} as never;
    const res = createMockRes();

    handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json'
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ openapi: '3.0.0' });
  });

  it('returns an error when the spec cannot be read', () => {
    (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('missing file');
    });

    const req = {} as never;
    const res = createMockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'OpenAPI spec no disponible. Ejecuta el build primero.',
      })
    );
  });
});
