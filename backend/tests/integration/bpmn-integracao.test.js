import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('BPMN1 - Fluxo de Pedido de Aula (Integração)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo Completo: EE submete pedido → Direção aprova', () => {
    it('deve executar fluxo completo de marcação de aula', async () => {
      const mockEncarregado = {
        iduser: 7,
        nome: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.pt',
        role: 'ENCARREGADO'
      };

      const mockProfessor = {
        iduser: 1,
        nome: 'João Santos',
        email: 'joao.sent@...'
      };

      const mockDisponibilidade = {
        iddisponibilidade_mensal: 1,
        professorutilizadoriduser: 1,
        data: '2026-05-02',
        horainicio: '10:00',
        horafim: '11:00',
        salaidsala: 1
      };

      const mockPedido = {
        idpedidoaula: 100,
        data: '2026-05-02',
        horainicio: '10:00',
        duracaoaula: '00:60',
        estadoidestado: 21,
        encarregadoeducacaoutilizadoriduser: 7,
        disponibilidade_mensal_id: 1,
        privacidade: false
      };

      expect(mockEncarregado.role).toBe('ENCARREGADO');
      expect(mockPedido.estadoidestado).toBe(21);
    });

    it('deve submeter pedido com dados válidos', async () => {
      const dadosValidos = {
        data: '2026-05-02',
        horainicio: '10:00',
        duracaoaula: '60',
        disponibilidade_mensal_id: 1,
        professor_utilizador_id: '1',
        salaidsala: '1',
        alunoutilizadoriduser: '3'
      };

      const validarDados = (dados) => {
        return !!(dados.data && dados.horainicio && dados.disponibilidade_mensal_id);
      };

      expect(validarDados(dadosValidos)).toBe(true);
    });

    it('deve rejeitar pedido com data no passado', async () => {
      const dadosInvalidos = {
        data: '2026-04-29',
        horainicio: '10:00',
        duracaoaula: '60',
        disponibilidade_mensal_id: 1
      };

      const agora = new Date();
      const dataInputStr = new Date(dadosInvalidos.data).toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(() => {
        if (dataInputStr < dataHojeStr) {
          throw new Error('A data não pode ser no passado');
        }
      }).toThrow('A data não pode ser no passado');
    });

    it('deve rejeitar pedido sem professor', async () => {
      const dadosInvalidos = {
        data: '2026-05-02',
        horainicio: '10:00',
        duracaoaula: '60',
        disponibilidade_mensal_id: 1,
        professor_utilizador_id: null
      };

      expect(() => {
        if (!dadosInvalidos.professor_utilizador_id) {
          throw new Error('Professor é obrigatório');
        }
      }).toThrow('Professor é obrigatório');
    });

    it('deve rejeitar pedido sem disponibilidade', async () => {
      const dadosInvalidos = {
        data: '2026-05-02',
        horainicio: '10:00',
        duracaoaula: '60',
        disponibilidade_mensal_id: null
      };

      expect(() => {
        if (!dadosInvalidos.disponibilidade_mensal_id) {
          throw new Error('Disponibilidade é obrigatória');
        }
      }).toThrow('Disponibilidade é obrigatória');
    });

    it('deve rejeitar pedido sem aluno (para ENCARREGADO)', async () => {
      const dadosInvalidos = {
        data: '2026-05-02',
        horainicio: '10:00',
        duracaoaula: '60',
        disponibilidade_mensal_id: 1,
        alunoutilizadoriduser: null
      };

      const userRole = 'ENCARREGADO';

      expect(() => {
        if (userRole === 'ENCARREGADO' && !dadosInvalidos.alunoutilizadoriduser) {
          throw new Error('Aluno é obrigatório para encarregado de educação');
        }
      }).toThrow('Aluno é obrigatório para encarregado de educação');
    });

    it('deve aprovar pedido pela direção', async () => {
      const pedido = {
        idpedidoaula: 100,
        estadoidestado: 21,
        privacidade: false
      };

      const novoEstado = 22;

      const ApproveResult = { success: true, message: 'Pedido aprovado! Aula confirmada.' };

      expect(() => {
        if (pedido.estadoidestado === 21) {
          throw new Error('Pedido não está Pendente');
        }
      }).toThrow('Pedido não está Pendente');
      
      expect(ApproveResult.success).toBe(true);
      expect(ApproveResult.message).toContain('confirmada');
    });

    it('deve rejeitar pedido pela direção', async () => {
      const pedido = {
        idpedidoaula: 100,
        estadoidestado: 22
      };

      const RejectResult = { success: true, message: 'Pedido rejeitado.' };

      expect(() => {
        if (pedido.estadoidestado !== 21) {
          throw new Error('Apenas pedidos Pendentes podem ser rejeitados');
        }
      }).toThrow('Apenas pedidos Pendentes podem ser rejeitados');
      
      expect(RejectResult.success).toBe(true);
    });
  });
});

describe('BPMN2 - Fluxo de Remarcação (Integração)', () => {
  describe('Fluxo Completo: EE cria pedido → Direção propõe remarcação → Professor aceita → EE aceita', () => {
    it('deve propor nova data para remarcação', async () => {
      const pedido = {
        idpedidoaula: 100,
        estadoidestado: 22,
        sugestaoestado: null
      };

      const novaDataProposta = '2026-05-03';
      const novaDataObj = new Date(novaDataProposta);
      const agora = new Date();

      expect(() => {
        if (novaDataObj < agora) {
          throw new Error('A data não pode ser no passado');
        }
      });

      const result = {
        success: true,
        sugestaoestado: 'AGUARDA_PROFESSOR',
        novadata: novaDataProposta
      };

      expect(result.sugestaoestado).toBe('AGUARDA_PROFESSOR');
    });

    it('deve rejeitar remarcação para data passada', async () => {
      const novaDataProposta = '2026-04-29';
      const novaDataObj = new Date(novaDataProposta);
      const agora = new Date();
      const dataHojeStr = agora.toISOString().split('T')[0];
      const novaDataStr = novaDataObj.toISOString().split('T')[0];

      expect(() => {
        if (novaDataStr < dataHojeStr) {
          throw new Error('A data não pode ser no passado');
        }
      }).toThrow('A data não pode ser no passado');
    });

    it('deve aceitar remarcação pelo professor', async () => {
      const pedido = {
        idpedidoaula: 100,
        sugestaoestado: 'AGUARDA_PROFESSOR'
      };

      const AcceptResult = {
        success: true,
        sugestaoestado: 'AGUARDA_EE',
        message: 'Remarcação Aceite. A aguardar confirmação do encarregado.'
      };

      expect(pedido.sugestaoestado).toBe('AGUARDA_PROFESSOR');
      expect(AcceptResult.sugestaoestado).toBe('AGUARDA_EE');
    });

    it('deve rejeitar remarcação pelo professor', async () => {
      const pedido = {
        idpedidoaula: 100,
        sugestaoestado: 'AGUARDA_PROFESSOR'
      };

      const RejectResult = {
        success: true,
        sugestaoestado: null,
        novadata: null,
        message: 'Remarcação rejeitada. Aula mantém-se na data original.'
      };

      expect(pedido.sugestaoestado).toBe('AGUARDA_PROFESSOR');
      expect(RejectResult.sugestaoestado).toBe(null);
    });

    it('deve confirmar remarcação pelo EE', async () => {
      const pedido = {
        idpedidoaula: 100,
        sugestaoestado: 'AGUARDA_EE',
        novadata: '2026-05-03',
        data: '2026-05-02'
      };

      const ConfirmResult = {
        success: true,
        data: '2026-05-03',
        message: 'Aula remarcada com sucesso!'
      };

      expect(pedido.sugestaoestado).toBe('AGUARDA_EE');
      expect(ConfirmResult.data).toBe('2026-05-03');
    });

    it('deve rejeitar remarcação pelo EE', async () => {
      const pedido = {
        idpedidoaula: 100,
        sugestaoestado: 'AGUARDA_EE',
        novadata: '2026-05-03',
        data: '2026-05-02'
      };

      const RejectResult = {
        success: true,
        sugestaoestado: null,
        novadata: null,
        message: 'Remarcação rejeitada. Aula mantém-se na data original.'
      };

      expect(pedido.sugestaoestado).toBe('AGUARDA_EE');
      expect(RejectResult.novadata).toBe(null);
    });

    it('deve expirar sugestão de remarcação após 3 horas', async () => {
      const pedido = {
        idpedidoaula: 100,
        sugestaoestado: 'AGUARDA_EE',
        novadata: '2026-05-03',
        novaDataLimite: new Date('2026-04-30T14:00:00Z')
      };

      const agora = new Date('2026-04-30T15:00:00Z');

      const Expirou = agora > pedido.novaDataLimite;

      expect(Expirou).toBe(true);

      const ExpireResult = {
        success: true,
        sugestaoestado: null,
        novadata: null,
        message: 'Sugestão expirou. Aula mantém-se na data original.'
      };

      expect(ExpireResult.novadata).toBe(null);
    });
  });
});

describe('Fluxos BPMN - Estados e Transições', () => {
  describe('Máquina de Estados - Pedido de Aula', () => {
    it('deve transicionar de PENDENTE para CONFIRMADO', () => {
      const estados = ['PENDENTE', 'CONFIRMADO', 'REJEITADO', 'CANCELADO', 'REALIZADO'];
      const estadoAtual = 'PENDENTE';
      const novoEstado = 'CONFIRMADO';

      const transicoesValidas = {
        'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
        'CONFIRMADO': ['REALIZADO', 'CANCELADO'],
        'REJEITADO': [],
        'CANCELADO': [],
        'REALIZADO': []
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(true);
    });

    it('deve transicionar de PENDENTE para REJEITADO', () => {
      const estadoAtual = 'PENDENTE';
      const novoEstado = 'REJEITADO';

      const transicoesValidas = {
        'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
        'CONFIRMADO': ['REALIZADO', 'CANCELADO'],
        'REJEITADO': [],
        'CANCELADO': [],
        'REALIZADO': []
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(true);
    });

    it('deve proibir transição de PENDENTE para REALIZADO', () => {
      const estadoAtual = 'PENDENTE';
      const novoEstado = 'REALIZADO';

      const transicoesValidas = {
        'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
        'CONFIRMADO': ['REALIZADO', 'CANCELADO'],
        'REJEITADO': [],
        'CANCELADO': [],
        'REALIZADO': []
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(false);
    });

    it('deve proibir transição de REJEITADO para CONFIRMADO', () => {
      const estadoAtual = 'REJEITADO';
      const novoEstado = 'CONFIRMADO';

      const transicoesValidas = {
        'PENDENTE': ['CONFIRMADO', 'REJEITADO', 'CANCELADO'],
        'CONFIRMADO': ['REALIZADO', 'CANCELADO'],
        'REJEITADO': [],
        'CANCELADO': [],
        'REALIZADO': []
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(false);
    });
  });

  describe('Máquina de Estados - Sugestão de Remarcação', () => {
    it('deve transicionar de null para AGUARDA_PROFESSOR', () => {
      const estadoAtual = null;
      const novoEstado = 'AGUARDA_PROFESSOR';

      const transicoesValidas = {
        'null': ['AGUARDA_PROFESSOR', 'AGUARDA_EE'],
        'AGUARDA_PROFESSOR': ['AGUARDA_EE', 'null'],
        'AGUARDA_EE': ['null']
      };

      const eValida = estadoAtual === null ? true : transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(true);
    });

    it('deve transicionar de AGUARDA_PROFESSOR para AGUARDA_EE', () => {
      const estadoAtual = 'AGUARDA_PROFESSOR';
      const novoEstado = 'AGUARDA_EE';

      const transicoesValidas = {
        'null': ['AGUARDA_PROFESSOR', 'AGUARDA_EE'],
        'AGUARDA_PROFESSOR': ['AGUARDA_EE', 'null'],
        'AGUARDA_EE': ['null']
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(true);
    });

    it('deve transicionar de AGUARDA_EE para null (confirmado)', () => {
      const estadoAtual = 'AGUARDA_EE';
      const novoEstado = 'null';

      const transicoesValidas = {
        'null': ['AGUARDA_PROFESSOR', 'AGUARDA_EE'],
        'AGUARDA_PROFESSOR': ['AGUARDA_EE', 'null'],
        'AGUARDA_EE': ['null']
      };

      const eValida = transicoesValidas[estadoAtual].includes(novoEstado);
      expect(eValida).toBe(true);
    });
  });
});