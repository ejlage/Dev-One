import * as figurinoController from '../controllers/figurino.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

export default async function figurinoRoutes(app, opts) {
    // No Fastify, para usar o middleware de auth, usamos preHandler
    //T17
    app.get('/', { preHandler: [verifyToken] }, figurinoController.getCatalogo);

    //T18
    app.get('/:id', { preHandler: [verifyToken] }, figurinoController.getFigurinoById);

    // T19
    app.post('/', { preHandler: [verifyToken] }, figurinoController.criarFigurino);
}