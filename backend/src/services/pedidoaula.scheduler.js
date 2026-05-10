import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_REJECT_HOURS = 3;

export async function startPedidoAulaScheduler() {
  console.log('[Scheduler] Pedido de Aula scheduler started');
  
  const checkAndAutoReject = async () => {
    try {
      const estadoPendente = await prisma.estado.findFirst({
        where: { tipoestado: 'PENDENTE' }
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
          where: { tipoestado: 'REJEITADO' }
        });

        if (estadoRejeitado) {
          for (const pedido of pedidosAntigos) {
            await prisma.pedidodeaula.update({
              where: { idpedidoaula: pedido.idpedidoaula },
              data: { estadoidestado: estadoRejeitado.idestado }
            });
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
          novadata: { not: null }
        },
        include: {
          aula: true,
          encarregadoeducacao: { include: { utilizador: true } }
        }
      });

      if (sugestoesExpiradas.length > 0) {
        const estadoCancelada = await prisma.estadoaula.findFirst({
          where: { nomeestadoaula: 'CANCELADA' }
        });

        for (const pedido of sugestoesExpiradas) {
          if (estadoCancelada && pedido.aula?.length > 0) {
            for (const aula of pedido.aula) {
              await prisma.aula.update({
                where: { idaula: aula.idaula },
                data: { estadoaulaidestadoaula: estadoCancelada.idestadoaula }
              });
            }
            
            await prisma.pedidodeaula.update({
              where: { idpedidoaula: pedido.idpedidoaula },
              data: { novaDataLimite: null, novadata: null }
            });
            
            console.log(`[Scheduler] Sugestão expirada - aula cancelada (pedido #${pedido.idpedidoaula})`);
          }
        }
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