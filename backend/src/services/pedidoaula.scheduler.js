import { PrismaClient } from "@prisma/client";
import { createNotificacao } from "./notificacoes.service.js";

const prisma = new PrismaClient();

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_REJECT_HOURS = 3;

export async function startPedidoAulaScheduler() {
  console.log('[Scheduler] Pedido de Aula scheduler started');
  
  const checkAndAutoReject = async () => {
    try {
      const estadoPendente = await prisma.estado.findFirst({
        where: { tipoestado: { equals: 'Pendente', mode: 'insensitive' } }
      });
      
      if (!estadoPendente) {
        return;
      }

      const tresHorasAgo = new Date(Date.now() - AUTO_REJECT_HOURS * 60 * 60 * 1000);
      
      const pedidosAntigos = await prisma.pedidodeaula.findMany({
        where: {
          estadoidestado: estadoPendente.idestado,
          datapedido: { lte: tresHorasAgo }
        }
      });

      if (pedidosAntigos.length > 0) {
        const estadoRejeitado = await prisma.estado.findFirst({
          where: { tipoestado: { equals: 'Rejeitado', mode: 'insensitive' } }
        });

        if (estadoRejeitado) {
          for (const pedido of pedidosAntigos) {
            await prisma.pedidodeaula.update({
              where: { idpedidoaula: pedido.idpedidoaula },
              data: { estadoidestado: estadoRejeitado.idestado }
            });

            await createNotificacao(
              pedido.encarregadoeducacaoutilizadoriduser,
              `O seu pedido de aula para ${new Date(pedido.data).toLocaleDateString('pt-PT')} foi rejeitado automaticamente por não ter sido avaliado em 3 horas. Pode submeter um novo pedido.`,
              'PEDIDO_REJEITADO_AUTO'
            );

            console.log(`[Scheduler] Auto-rejeitado pedido #${pedido.idpedidoaula} (3h timeout)`);
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error auto-rejecting pedidos:', error.message);
    }
  };

  const checkAndExpireSugestoes = async () => {
    try {
      const now = new Date();

      const sugestoesExpiradas = await prisma.pedidodeaula.findMany({
        where: {
          novaDataLimite: { not: null, lte: now },
          sugestaoestado: { not: null },
        },
        include: {
          aula: true,
          encarregadoeducacao: { include: { utilizador: true } },
          disponibilidade_mensal: true,
        },
      });

      if (sugestoesExpiradas.length === 0) return;

      const estadoCancelada = await prisma.estadoaula.findFirst({
        where: { nomeestadoaula: 'CANCELADA' },
      });
      const estadoCancelado = await prisma.estado.findFirst({
        where: { tipoestado: { equals: 'Cancelado', mode: 'insensitive' } },
      });
      const direcao = await prisma.direcao.findFirst();

      for (const pedido of sugestoesExpiradas) {
        if (estadoCancelada && pedido.aula?.length > 0) {
          for (const aula of pedido.aula) {
            await prisma.aula.update({
              where: { idaula: aula.idaula },
              data: { estadoaulaidestadoaula: estadoCancelada.idestadoaula },
            });
          }
        }

        await prisma.pedidodeaula.update({
          where: { idpedidoaula: pedido.idpedidoaula },
          data: {
            novaDataLimite: null,
            novadata: null,
            sugestaoestado: null,
            ...(estadoCancelado && { estadoidestado: estadoCancelado.idestado }),
          },
        });

        const participanteTexto =
          pedido.sugestaoestado === 'AGUARDA_PROFESSOR' ? 'professor'
          : pedido.sugestaoestado === 'AGUARDA_DIRECAO' ? 'direção'
          : 'encarregado';

        await createNotificacao(
          pedido.encarregadoeducacaoutilizadoriduser,
          `A sugestão de remarcação da aula expirou (sem resposta da ${participanteTexto}). A aula foi cancelada.`,
          'SUGESTAO_EXPIRADA'
        );

        const professorId = pedido.disponibilidade_mensal?.professorutilizadoriduser;
        if (professorId) {
          await createNotificacao(
            professorId,
            `A sugestão de remarcação da aula expirou. A aula foi cancelada.`,
            'SUGESTAO_EXPIRADA'
          );
        }

        if (direcao) {
          const direcaoMsg = pedido.sugestaoestado === 'AGUARDA_DIRECAO'
            ? `O prazo para responder ao pedido de remarcação da aula #${pedido.idpedidoaula} expirou. A aula foi cancelada.`
            : `A sugestão de remarcação da aula expirou (pedido #${pedido.idpedidoaula}). A aula foi cancelada.`;
          await createNotificacao(direcao.utilizadoriduser, direcaoMsg, 'SUGESTAO_EXPIRADA');
        }

        console.log(`[Scheduler] Sugestão expirada - aula cancelada (pedido #${pedido.idpedidoaula})`);
      }
    } catch (error) {
      console.error('[Scheduler] Error checking sugestoes expiradas:', error.message);
    }
  };

  checkAndAutoReject();
  checkAndExpireSugestoes();
  
  setInterval(checkAndAutoReject, CHECK_INTERVAL_MS);
  setInterval(checkAndExpireSugestoes, CHECK_INTERVAL_MS);
}

export async function stopPedidoAulaScheduler() {
  console.log('[Scheduler] Pedido de Aula scheduler stopped');
}