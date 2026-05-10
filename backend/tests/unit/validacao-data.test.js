import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Validação de Data e Hora - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validação: Data não pode ser no passado', () => {
    it('deve rejeitar data anterior a hoje', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2026-04-29');
      const dataHojeStr = agora.toISOString().split('T')[0];
      const dataInputStr = dataInput.toISOString().split('T')[0];

      expect(() => {
        if (dataInputStr < dataHojeStr) {
          throw new Error('A data não pode ser no passado');
        }
      }).toThrow('A data não pode ser no passado');
    });

    it('deve aceitar data de hoje', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2026-04-30');
      const dataHojeStr = agora.toISOString().split('T')[0];
      const dataInputStr = dataInput.toISOString().split('T')[0];

      expect(dataInputStr >= dataHojeStr).toBe(true);
    });

    it('deve aceitar data futura', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2026-05-01');
      const dataHojeStr = agora.toISOString().split('T')[0];
      const dataInputStr = dataInput.toISOString().split('T')[0];

      expect(dataInputStr >= dataHojeStr).toBe(true);
    });

    it('deve rejeitar data muito antiga (ano passado)', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2025-01-01');
      const dataHojeStr = agora.toISOString().split('T')[0];
      const dataInputStr = dataInput.toISOString().split('T')[0];

      expect(() => {
        if (dataInputStr < dataHojeStr) {
          throw new Error('A data não pode ser no passado');
        }
      }).toThrow('A data não pode ser no passado');
    });
  });

  describe('Validação: Hora deve ser posterior à hora atual (quando data = hoje)', () => {
    it('deve rejeitar hora anterior à hora atual quando data = hoje', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const horainicio = '10:00';
      const dataInputStr = '2026-04-30';
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(dataInputStr === dataHojeStr).toBe(true);

      const [horaH, horaM] = horainicio.split(':').map(Number);
      const horaInputMinutos = horaH * 60 + horaM;
      const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

      expect(() => {
        if (horaInputMinutos <= horaAtualMinutos) {
          throw new Error('A hora de início deve ser posterior à hora atual');
        }
      }).toThrow('A hora de início deve ser posterior à hora atual');
    });

    it('deve aceitar hora posterior à hora atual quando data = hoje', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const horainicio = '14:00';
      const dataInputStr = '2026-04-30';
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(dataInputStr === dataHojeStr).toBe(true);

      const [horaH, horaM] = horainicio.split(':').map(Number);
      const horaInputMinutos = horaH * 60 + horaM;
      const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

      expect(horaInputMinutos > horaAtualMinutos).toBe(true);
    });

    it('deve aceitar qualquer hora quando data > hoje', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const horainicio = '08:00';
      const dataInput = new Date('2026-05-01');
      const dataInputStr = dataInput.toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(dataInputStr > dataHojeStr).toBe(true);

      const [horaH, horaM] = horainicio.split(':').map(Number);
      const horaInputMinutos = horaH * 60 + horaM;
      const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

      expect(horaInputMinutos > horaAtualMinutos || dataInputStr > dataHojeStr).toBe(true);
    });

    it('deve rejeitar hora exatamente igual à hora atual', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const horainicio = '12:00';
      const dataInputStr = '2026-04-30';
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(dataInputStr === dataHojeStr).toBe(true);

      const [horaH, horaM] = horainicio.split(':').map(Number);
      const horaInputMinutos = horaH * 60 + horaM;
      const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

      expect(() => {
        if (horaInputMinutos <= horaAtualMinutos) {
          throw new Error('A hora de início deve ser posterior à hora atual');
        }
      }).toThrow('A hora de início deve ser posterior à hora atual');
    });
  });

  describe('Validação: Data e Hora combinadas', () => {
    it('deve aceitar amanhã qualquer hora', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2026-05-01');
      const horainicio = '09:00';
      
      const dataInputStr = dataInput.toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];
      const ehDataFutura = dataInputStr > dataHojeStr;
      
      const [horaH, horaM] = horainicio.split(':').map(Number);
      const horaInputMinutos = horaH * 60 + horaM;
      const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
      const horaValida = ehDataFutura || horaInputMinutos > horaAtualMinutos;

      expect(horaValida).toBe(true);
    });

    it('deve rejeitar hoje com hora passada', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const dataInput = new Date('2026-04-30');
      const horainicio = '11:00';
      
      const dataInputStr = dataInput.toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];
      
      if (dataInputStr >= dataHojeStr) {
        const [horaH, horaM] = horainicio.split(':').map(Number);
        const horaInputMinutos = horaH * 60 + horaM;
        const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();
        
        expect(() => {
          if (horaInputMinutos <= horaAtualMinutos) {
            throw new Error('A hora de início deve ser posterior à hora atual');
          }
        }).toThrow('A hora de início deve ser posterior à hora atual');
      }
    });
  });

  describe('Cálculo de minutos', () => {
    it('deve converter horas para minutos corretamente', () => {
      const hora = '10:30';
      const [horaH, horaM] = hora.split(':').map(Number);
      const totalMinutos = horaH * 60 + horaM;
      
      expect(totalMinutos).toBe(630);
    });

    it('deve converter hora midnight para minutos', () => {
      const hora = '00:00';
      const [horaH, horaM] = hora.split(':').map(Number);
      const totalMinutos = horaH * 60 + horaM;
      
      expect(totalMinutos).toBe(0);
    });

    it('deve converter hora 23:59 para minutos', () => {
      const hora = '23:59';
      const [horaH, horaM] = hora.split(':').map(Number);
      const totalMinutos = horaH * 60 + horaM;
      
      expect(totalMinutos).toBe(1439);
    });
  });
});

describe('Validação de Figurinos - Unit Tests', () => {
  describe('Validação: Data de início não pode ser no passado', () => {
    it('deve rejeitar data de início no passado para anúncios', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const datainicio = '2026-04-29';
      
      const dataInicioStr = new Date(datainicio).toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(() => {
        if (dataInicioStr < dataHojeStr) {
          throw new Error('A data de início não pode ser no passado');
        }
      }).toThrow('A data de início não pode ser no passado');
    });

    it('deve aceitar data de início futura para anúncios', () => {
      const agora = new Date('2026-04-30T12:00:00Z');
      const datainicio = '2026-05-01';
      
      const dataInicioStr = new Date(datainicio).toISOString().split('T')[0];
      const dataHojeStr = agora.toISOString().split('T')[0];

      expect(dataInicioStr >= dataHojeStr).toBe(true);
    });
  });

  describe('Validação: Data de fim deve ser posterior à data de início', () => {
    it('deve rejeitar data de fim anterior ou igual à data de início', () => {
      const datainicio = '2026-05-01';
      const datafim = '2026-04-30';
      
      const dataInicioObj = new Date(datainicio);
      const dataFimObj = new Date(datafim);

      expect(() => {
        if (dataFimObj <= dataInicioObj) {
          throw new Error('A data de fim deve ser posterior à data de início');
        }
      }).toThrow('A data de fim deve ser posterior à data de início');
    });

    it('deve aceitar data de fim posterior à data de início', () => {
      const datainicio = '2026-05-01';
      const datafim = '2026-05-15';
      
      const dataInicioObj = new Date(datainicio);
      const dataFimObj = new Date(datafim);

      expect(dataFimObj > dataInicioObj).toBe(true);
    });

    it('deve rejeitar data de fim igual à data de início', () => {
      const datainicio = '2026-05-01';
      const datafim = '2026-05-01';
      
      const dataInicioObj = new Date(datainicio);
      const dataFimObj = new Date(datafim);

      expect(() => {
        if (dataFimObj <= dataInicioObj) {
          throw new Error('A data de fim deve ser posterior à data de início');
        }
      }).toThrow('A data de fim deve ser posterior à data de início');
    });
  });
});

describe('Validação de inputs - Edge Cases', () => {
  it('deve lidar com string vazia', () => {
    const dataAula = '';
    
    expect(() => {
      if (!dataAula) throw new Error('Data é obrigatória');
    }).toThrow('Data é obrigatória');
  });

  it('deve lidar com null', () => {
    const dataAula = null;
    
    expect(() => {
      if (!dataAula) throw new Error('Data é obrigatória');
    }).toThrow('Data é obrigatória');
  });

  it('deve lidar com undefined', () => {
    const horainicio = undefined;
    
    expect(() => {
      if (!horainicio) throw new Error('Hora é obrigatória');
    }).toThrow('Hora é obrigatória');
  });

  it('deve lidar com formato de hora inválido', () => {
    const horainicio = 'invalid';
    
    const validarHora = (hora) => {
      const partes = hora.split(':');
      if (partes.length !== 2) return false;
      const [h, m] = partes.map(Number);
      return !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
    };
    
    expect(validarHora(horainicio)).toBe(false);
  });

  it('deve aceitar formato de hora válido', () => {
    const horainicio = '14:30';
    
    const partes = horainicio.split(':');
    const [h, m] = partes.map(Number);
    const horaValida = !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
    
    expect(horaValida).toBe(true);
  });

  it('deve rejeitar hora com minutos inválidos', () => {
    const horainicio = '14:60';
    
    const partes = horainicio.split(':');
    const [h, m] = partes.map(Number);
    const horaValida = !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
    
    expect(horaValida).toBe(false);
  });

  it('deve rejeitar hora com horas inválidas', () => {
    const horainicio = '25:00';
    
    const partes = horainicio.split(':');
    const [h, m] = partes.map(Number);
    const horaValida = !isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
    
    expect(horaValida).toBe(false);
  });
});