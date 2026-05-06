const swaggerJSDoc = jest.fn(() => ({ openapi: '3.0.0' }));

jest.mock('swagger-jsdoc', () => ({
  __esModule: true,
  default: swaggerJSDoc,
}));

describe('swaggerSpec', () => {
  beforeEach(() => {
    jest.resetModules();
    swaggerJSDoc.mockClear();
  });

  it('builds the OpenAPI spec from the API annotations', () => {
    const { swaggerSpec } = require('@/lib/swagger');

    expect(swaggerSpec).toEqual({ openapi: '3.0.0' });
    expect(swaggerJSDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        definition: expect.objectContaining({
          info: expect.objectContaining({
            title: 'Cash Track API',
          }),
        }),
        apis: ['pages/api/**/*.ts'],
      })
    );
  });
});
