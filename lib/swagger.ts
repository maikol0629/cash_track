import swaggerJSDoc, { type OAS3Options } from 'swagger-jsdoc';

const options: OAS3Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cash Track API',
      version: '1.0.0',
      description:
        'API de gestión de movimientos, usuarios y reportes para la prueba técnica.',
    },
  },
  apis: ['pages/api/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
