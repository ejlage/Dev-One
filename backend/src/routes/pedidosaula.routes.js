import { 
  getAllPedidosAula, 
  getPedidoAulaById, 
  getMyPedidos,
  getPedidosPendentes,
  createPedidoAula, 
  approvePedidoAula,
  rejectPedidoAula,
  deletePedidoAula 
} from '../controllers/pedidosaula.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

export default async function pedidosaulaRoutes(fastify, options) {
  
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', {
    preHandler: authorizeRole('DIRECAO')
  }, getAllPedidosAula);

  fastify.get('/pendentes', {
    preHandler: authorizeRole('DIRECAO')
  }, getPedidosPendentes);

  fastify.get('/my', {
    preHandler: authorizeRole('ENCARREGADO')
  }, getMyPedidos);

  fastify.get('/:id', getPedidoAulaById);

  fastify.post('/', {
    preHandler: authorizeRole('ENCARREGADO')
  }, createPedidoAula);

  fastify.post('/:id/approve', {
    preHandler: authorizeRole('DIRECAO')
  }, approvePedidoAula);

  fastify.post('/:id/reject', {
    preHandler: authorizeRole('DIRECAO')
  }, rejectPedidoAula);

  fastify.delete('/:id', {
    preHandler: authorizeRole('DIRECAO')
  }, deletePedidoAula);
}