import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';

// Get directory name for current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the swagger.json file
const swaggerDocument = JSON.parse(
  fs.readFileSync(join(__dirname, './swagger.json'), 'utf8')
);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

export default setupSwagger;