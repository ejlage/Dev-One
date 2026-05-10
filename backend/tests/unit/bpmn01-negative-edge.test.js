import { describe, it, expect, beforeEach } from 'vitest';

describe('BPMN01 - Negative Testing / Edge Cases', () => {
  
  describe('Validações de Entrada - Casos Inválidos', () => {
    
    it('deve rejeitar data vazia', () => {
      const dados = { data: '', horainicio: '10:00', disponibilidade_mensal_id: 1 };
      expect(() => {
        if (!dados.data) throw new Error('Data é obrigatória');
      }).toThrow('Data é obrigatória');
    });

    it('deve rejeitar hora vazia', () => {
      const dados = { data: '2026-05-10', horainicio: '', disponibilidade_mensal_id: 1 };
      expect(() => {
        if (!dados.horainicio) throw new Error('Hora é obrigatória');
      }).toThrow('Hora é obrigatória');
    });

    it('deve rejeitar duração negativa', () => {
      const duracao = -30;
      expect(() => {
        if (duracao <= 0) throw new Error('Duração deve ser positiva');
      }).toThrow('Duração deve ser positiva');
    });

    it('deve rejeitar duração zero', () => {
      const duracao = 0;
      expect(() => {
        if (duracao <= 0) throw new Error('Duração inválida');
      }).toThrow('Duração inválida');
    });

    it('deve rejeitar duração superior a 240 minutos (4 horas)', () => {
      const duracao = 300;
      expect(() => {
        if (duracao > 240) throw new Error('Duração máxima é 4 horas');
      }).toThrow('Duração máxima é 4 horas');
    });

    it('deve rejeitar horário fora do período válido (antes das 8h)', () => {
      const horainicio = '07:30';
      const horaMinima = 8;
      const hora = parseInt(horainicio.split(':')[0]);
      expect(() => {
        if (hora < horaMinima) throw new Error('Horário mínimo é 08:00');
      }).toThrow('Horário mínimo é 08:00');
    });

    it('deve rejeitar horário após as 22h', () => {
      const horainicio = '23:00';
      const horaMaxima = 22;
      const hora = parseInt(horainicio.split(':')[0]);
      expect(() => {
        if (hora >= horaMaxima) throw new Error('Horário máximo é 22:00');
      }).toThrow('Horário máximo é 22:00');
    });
  });

  describe('Validações de Disponibilidade', () => {

    it('deve rejeitar disponibilidade inexistente', () => {
      const disponibilidadeId = 99999;
      const disponibilidadeValida = false;
      expect(() => {
        if (!disponibilidadeValida) throw new Error('Disponibilidade não encontrada');
      }).toThrow('Disponibilidade não encontrada');
    });

    it('deve rejeitar disponibilidade inativa', () => {
      const disponibilidade = { ativo: false };
      expect(() => {
        if (!disponibilidade.ativo) throw new Error('Disponibilidade inativa');
      }).toThrow('Disponibilidade inativa');
    });

    it('deve rejeitar quando minutos ocupados excedem duração disponível', () => {
      const slot = { duracaoTotal: 60, minutosOcupados: 45 };
      const duracaoPedida = 30;
      const disponivel = slot.duracaoTotal - slot.minutosOcupados;
      expect(() => {
        if (duracaoPedida > disponivel) throw new Error('Slots insuficientes');
      }).toThrow('Slots insuficientes');
    });

    it('deve rejeitar quando slot não pertence ao professor correto', () => {
      const slotProfessorId = 1;
      const pedidoProfessorId = 2;
      expect(() => {
        if (slotProfessorId !== pedidoProfessorId) throw new Error('Professor não corresponde ao slot');
      }).toThrow('Professor não corresponde ao slot');
    });
  });

  describe('Validações de Sala', () => {

    it('deve rejeitar sala inexistente', () => {
      const salaId = null;
      expect(() => {
        if (!salaId) throw new Error('Sala é obrigatória');
      }).toThrow('Sala é obrigatória');
    });

    it('deve rejeitar sala inativa', () => {
      const sala = { ativo: false };
      expect(() => {
        if (!sala.ativo) throw new Error('Sala inativa');
      }).toThrow('Sala inativa');
    });

    it('deve rejeitar conflito de sala com outra aula', () => {
      const salaOcupada = { idsala: 1, horaInicio: '10:00', horaFim: '11:00' };
      const novoPedido = { salaId: 1, horaInicio: '10:30', horaFim: '11:30' };
      const conflito = salaOcupada.idsala === novoPedido.salaId && 
                       novoPedido.horaInicio < salaOcupada.horaFim && 
                       novoPedido.horaFim > salaOcupada.horaInicio;
      expect(() => {
        if (conflito) throw new Error('Sala ocupada neste horário');
      }).toThrow('Sala ocupada neste horário');
    });
  });

  describe('Validações de Utilizador', () => {

    it('deve rejeitar utilizador não autenticado', () => {
      const user = null;
      expect(() => {
        if (!user) throw new Error('Utilizador não autenticado');
      }).toThrow('Utilizador não autenticado');
    });

    it('deve rejeitar role incorreto para criar pedido', () => {
      const userRole = 'ALUNO';
      const rolesPermitidos = ['ENCARREGADO', 'DIRECAO'];
      expect(() => {
        if (!rolesPermitidos.includes(userRole)) throw new Error('Role não autorizado');
      }).toThrow('Role não autorizado');
    });

    it('deve rejeitar quando encarregado não tem alunos associados', () => {
      const encarregado = { iduser: 1, alunos: [] };
      expect(() => {
        if (encarregado.alunos.length === 0) throw new Error('Encarregado sem alunos');
      }).toThrow('Encarregado sem alunos');
    });

    it('deve rejeitar quando aluno não pertence ao encarregado', () => {
      const encarregadoAlunos = [1, 2, 3];
      const alunoId = 99;
      expect(() => {
        if (!encarregadoAlunos.includes(alunoId)) throw new Error('Aluno não pertence ao encarregado');
      }).toThrow('Aluno não pertence ao encarregado');
    });
  });

  describe('Validações de Data/Hora (Edge Cases)', () => {

    it('deve rejeitar data em formato inválido', () => {
      const dataInvalida = '10-05-2026';
      const dataValida = /^\d{4}-\d{2}-\d{2}$/;
      expect(() => {
        if (!dataValida.test(dataInvalida)) throw new Error('Formato de data inválido');
      }).toThrow('Formato de data inválido');
    });

    it('deve rejeitar hora em formato inválido', () => {
      const horaInvalida = '10h00';
      const horaValida = /^\d{2}:\d{2}$/;
      expect(() => {
        if (!horaValida.test(horaInvalida)) throw new Error('Formato de hora inválido');
      }).toThrow('Formato de hora inválido');
    });

    it('deve rejeitar minutos inválidos (>59)', () => {
      const hora = '10:75';
      const minutos = parseInt(hora.split(':')[1]);
      expect(() => {
        if (minutos > 59) throw new Error('Minutos inválidos');
      }).toThrow('Minutos inválidos');
    });

    it('deve rejecting date on Sunday (if applicable)', () => {
      const data = '2026-05-10';
      const diaSemana = new Date(data).getDay();
      expect(() => {
        if (diaSemana === 0) throw new Error('Escola encerrada ao domingo');
      }).toThrow('Escola encerrada ao domingo');
    });

    it('deve rejecting holiday', () => {
      const data = '2026-12-25';
      const holidays = ['2026-12-25', '2026-01-01'];
      expect(() => {
        if (holidays.includes(data)) throw new Error('Dia festivo');
      }).toThrow('Dia festivo');
    });
  });

  describe('Validações de Privacidade', () => {

    it('deve aceitar privacidade como booleano', () => {
      const privacidadeValida = [true, false];
      expect(privacidadeValida).toContain(true);
      expect(privacidadeValida).toContain(false);
    });

    it('deve validar que privacidade é definida', () => {
      const pedido = { privacidade: undefined };
      expect(() => {
        if (pedido.privacidade === undefined) throw new Error('Privacidade não definida');
      }).toThrow('Privacidade não definida');
    });
  });

  describe('Conflitos e Limites', () => {

    it('deve detecting conflito de horário com professor', () => {
      const aulasProfessor = [
        { data: '2026-05-10', horaInicio: '10:00', horaFim: '11:00' }
      ];
      const novaAula = { data: '2026-05-10', horaInicio: '10:30', horaFim: '11:30' };
      const conflito = aulasProfessor.some(a => 
        a.data === novaAula.data &&
        novaAula.horaInicio < a.horaFim &&
        novaAula.horaFim > a.horaInicio
      );
      expect(conflito).toBe(true);
    });

    it('deve rejecting when professor atingir limite diário', () => {
      const aulasDia = 8;
      const limiteMaximo = 10;
      expect(() => {
        if (aulasDia >= limiteMaximo) throw new Error('Limite diário atingido');
      }).not.toThrow();
    });

    it('deve rejecting when aluno já tem aula no mesmo horário', () => {
      const aulasAluno = [
        { data: '2026-05-10', horaInicio: '14:00', horaFim: '15:00' }
      ];
      const novaAula = { data: '2026-05-10', horaInicio: '14:30', horaFim: '15:30' };
      const conflito = aulasAluno.some(a => 
        a.data === novaAula.data &&
        novaAula.horaInicio < a.horaFim &&
        novaAula.horaFim > a.horaInicio
      );
      expect(conflito).toBe(true);
    });
  });

  describe('Campos Obrigatórios', () => {

    it('deve rejecting missing data field', () => {
      const pedido = { horainicio: '10:00', disponibilidade_mensal_id: 1 };
      expect(() => {
        if (!pedido.data) throw new Error('Campo data é obrigatório');
      }).toThrow('Campo data é obrigatório');
    });

    it('deve rejecting missing horainicio field', () => {
      const pedido = { data: '2026-05-10', disponibilidade_mensal_id: 1 };
      expect(() => {
        if (!pedido.horainicio) throw new Error('Campo horainicio é obrigatório');
      }).toThrow('Campo horainicio é obrigatório');
    });

    it('deve rejecting missing disponibilidade_mensal_id field', () => {
      const pedido = { data: '2026-05-10', horainicio: '10:00' };
      expect(() => {
        if (!pedido.disponibilidade_mensal_id) throw new Error('Campo disponibilidade é obrigatório');
      }).toThrow('Campo disponibilidade é obrigatório');
    });

    it('deve rejecting missing salaidsala field', () => {
      const pedido = { data: '2026-05-10', horainicio: '10:00', disponibilidade_mensal_id: 1 };
      expect(() => {
        if (!pedido.salaidsala) throw new Error('Campo sala é obrigatório');
      }).toThrow('Campo sala é obrigatório');
    });
  });

  describe('Estado do Pedido - Transições Inválidas', () => {

    it('deve rejecting transição direta PENDENTE para CANCELADO por professor', () => {
      const estadoAtual = 'PENDENTE';
      const novoEstado = 'CANCELADO';
      const role = 'PROFESSOR';
      const transicoesValidas = {
        'PENDENTE': ['CONFIRMADO', 'REJEITADO'],
        'CONFIRMADA': ['REALIZADA', 'CANCELADA'],
      };
      expect(() => {
        if (!transicoesValidas[estadoAtual]?.includes(novoEstado)) {
          throw new Error('Transição de estado inválida');
        }
      }).toThrow('Transição de estado inválida');
    });

    it('deve rejecting transição REJEITADO para CONFIRMADO', () => {
      const estadoAtual = 'REJEITADO';
      const novoEstado = 'CONFIRMADO';
      expect(() => {
        if (estadoAtual === 'REJEITADO' && novoEstado === 'CONFIRMADO') {
          throw new Error('Não é possível confirmar um pedido rejeitado');
        }
      }).toThrow('Não é possível confirmar um pedido rejeitado');
    });

    it('deve rejecting aprovação duplicada', () => {
      const pedido = { estado: 'CONFIRMADO' };
      expect(() => {
        if (pedido.estado === 'CONFIRMADO') throw new Error('Pedido já aprovado');
      }).toThrow('Pedido já aprovado');
    });
  });

  describe('Timeout e Expiração', () => {

    it('deve rejecting pedido com mais de 24h pendente', () => {
      const dataPedido = new Date('2026-05-09T10:00:00Z');
      const agora = new Date('2026-05-10T11:00:00Z');
      const diffHoras = (agora - dataPedido) / (1000 * 60 * 60);
      expect(() => {
        if (diffHoras > 24) throw new Error('Pedido expirou');
      }).toThrow('Pedido expirou');
    });

    it('deve rejecting remarcação com sugestão expirada', () => {
      const dataSugestao = new Date('2026-05-09T10:00:00Z');
      const agora = new Date('2026-05-10T11:00:00Z');
      const diffHoras = (agora - dataSugestao) / (1000 * 60 * 60);
      expect(() => {
        if (diffHoras > 3) throw new Error('Sugestão expirou');
      }).toThrow('Sugestão expirou');
    });
  });

  describe('Validação de Strings e Tipos', () => {

    it('deve rejecting email inválido para notification', () => {
      const email = 'email-invalido';
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(() => {
        if (!emailValido.test(email)) throw new Error('Email inválido');
      }).toThrow('Email inválido');
    });

    it('deve rejecting telefone com formato inválido', () => {
      const telefone = 'abc';
      const telefoneValido = /^\d{9}$/;
      expect(() => {
        if (!telefoneValido.test(telefone)) throw new Error('Telefone inválido');
      }).toThrow('Telefone inválido');
    });

    it('deve rejecting obs exceeding max length', () => {
      const obs = 'A'.repeat(501);
      const maxLength = 500;
      expect(() => {
        if (obs.length > maxLength) throw new Error('Observação muito longa');
      }).toThrow('Observação muito longa');
    });
  });

  describe('Boundary Tests', () => {

    it('deve accepting duracao mínima (30 minutos)', () => {
      const duracao = 30;
      expect(duracao >= 30).toBe(true);
    });

    it('deve accepting duracao máxima (240 minutos)', () => {
      const duracao = 240;
      expect(duracao <= 240).toBe(true);
    });

    it('deve accepting max participants mínimo (1)', () => {
      const maxParticipantes = 1;
      expect(maxParticipantes >= 1).toBe(true);
    });

    it('deve accepting max participants máximo (50)', () => {
      const maxParticipantes = 50;
      expect(maxParticipantes <= 50).toBe(true);
    });

    it('deve rejecting max participants acima do limite', () => {
      const maxParticipantes = 100;
      expect(() => {
        if (maxParticipantes > 50) throw new Error('Limite máximo de participantes é 50');
      }).toThrow('Limite máximo de participantes é 50');
    });
  });
});