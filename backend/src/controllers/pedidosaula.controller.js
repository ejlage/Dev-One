import * as pedidosaulaService from '../services/pedidosaula.service.js';
import * as notificacoesService from '../services/notificacoes.service.js';

export async function getAllPedidosAula(req, reply) {
  try {
    const pedidos = await pedidosaulaService.getAllPedidosAula();
    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Error getting pedidos:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function getPedidoAulaById(req, reply) {
  try {
    const { id } = req.params;
    const pedido = await pedidosaulaService.getPedidoAulaById(id);
    
    if (!pedido) {
      return reply.status(404).send({ success: false, error: 'Pedido não encontrado' });
    }
    
    return { success: true, data: pedido };
  } catch (error) {
    console.error('Error getting pedido:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function getMyPedidos(req, reply) {
  try {
    const userId = req.user.id;
    const pedidos = await pedidosaulaService.getPedidosByEncarregado(userId);
    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Error getting my pedidos:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function getPedidosPendentes(req, reply) {
  try {
    const pedidos = await pedidosaulaService.getPedidosPendentes();
    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Error getting pending pedidos:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function createPedidoAula(req, reply) {
  try {
    const userId = req.user.id;
    const { 
      data: dataAula, 
      horainicio, 
      duracaoaula, 
      maxparticipantes, 
      privacidade,
      disponibilidadeiddisponibilidade, 
      grupoidgrupo, 
      salaidsala
    } = req.body;

    if (!dataAula || !horainicio || !disponibilidadeiddisponibilidade || !salaidsala) {
      return reply.status(400).send({ 
        success: false, 
        error: 'Campos obrigatórios: data, horainicio, disponibilidadeiddisponibilidade, salaidsala' 
      });
    }

    const pedido = await pedidosaulaService.createPedidoAula({
      data: dataAula,
      horainicio,
      duracaoaula: duracaoaula || '01:00',
      maxparticipantes: maxparticipantes || 10,
      privacidade: privacidade || false,
      disponibilidadeiddisponibilidade,
      grupoidgrupo,
      salaidsala,
      encarregadoeducacaoutilizadoriduser: userId
    });

    return { success: true, data: pedido, message: 'Pedido submetido com sucesso!' };
  } catch (error) {
    console.error('Error creating pedido:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function approvePedidoAula(req, reply) {
  try {
    const { id } = req.params;
    
    const pedido = await pedidosaulaService.updatePedidoAulaStatus(id, 'CONFIRMADO');
    
    if (pedido && pedido.encarregadoeducacao) {
      await notificacoesService.createNotificacao(
        pedido.encarregadoeducacao.utilizadoriduser,
        `O seu pedido de aula para ${new Date(pedido.data).toLocaleDateString('pt-PT')} foi aprovado!`,
        'PEDIDO_APROVADO'
      );
    }
    
    return { 
      success: true, 
      data: pedido, 
      message: 'Pedido aprovado! Aula confirmada.' 
    };
  } catch (error) {
    console.error('Error approving pedido:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function rejectPedidoAula(req, reply) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const pedido = await pedidosaulaService.updatePedidoAulaStatus(id, 'REJEITADO');
    
    if (pedido && pedido.encarregadoeducacao) {
      await notificacoesService.createNotificacao(
        pedido.encarregadoeducacao.utilizadoriduser,
        `O seu pedido de aula foi rejeitado.${motivo ? ` Motivo: ${motivo}` : ''}`,
        'PEDIDO_REJEITADO'
      );
    }
    
    return { 
      success: true, 
      data: pedido, 
      message: 'Pedido rejeitado.' 
    };
  } catch (error) {
    console.error('Error rejecting pedido:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}

export async function deletePedidoAula(req, reply) {
  try {
    const { id } = req.params;
    
    await pedidosaulaService.deletePedidoAula(id);
    
    return { success: true, message: 'Pedido eliminado com sucesso!' };
  } catch (error) {
    console.error('Error deleting pedido:', error);
    return reply.status(500).send({ success: false, error: error.message });
  }
}