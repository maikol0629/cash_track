// Script de build para generar el archivo OpenAPI estático
// Se ejecuta antes de `next build` y NO se usa en tiempo de ejecución.

const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cash Track API',
      version: '1.0.0',
      description:
        'API de gestión de movimientos, usuarios y reportes para la prueba técnica.',
    },
  },
  // Se leen las anotaciones JSDoc de las rutas de API en tiempo de build
  apis: ['pages/api/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

const outputDir = path.join(process.cwd(), 'public');
const outputPath = path.join(outputDir, 'openapi.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');

console.log(`OpenAPI spec generada en: ${outputPath}`);
