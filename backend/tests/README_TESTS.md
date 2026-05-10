# Plano de Testes Automatizados - EntArtes

## 1. Visão Geral

Este documento define a estratégia de testes para validar os fluxos BPMN do projeto EntArtes. Os testes são executados usando **Vitest** (backend) e **React Testing Library** (frontend).

### Ferramentas Utilizadas

| Camada | Ferramenta | Versão |
|-------|------------|--------|
| Backend | Vitest | ^2.0.0 |
| Backend | Supertest | ^7.0.0 |
| Backend | Prisma Test Utils | ^0.0.0 |
| Frontend | Vitest | ^2.0.0 |
| Frontend | React Testing Library | ^14.0.0 |
| Frontend | MSW | ^2.0.0 |
| Mock HTTP | Faker | ^9.0.0 |

---

## 2. Estrutura de Ficheiros

```
backend/
├── tests/
│   ├── unit/
│   │   ├── pedidosaula.test.js
│   │   ├── aulas.test.js
│   │   ├── anuncios.test.js
│   │   ├── aluguerFigurino.test.js
│   │   └── notificacoes.test.js
│   ├── integration/
│   │   ├── bpmn-pedidoaula.test.js
│   │   ├── bpmn-remarcacao.test.js
│   │   ├── bpmn-criaranuncio.test.js
│   │   └── bpmn-aluguerfigurino.test.js
│   └── helpers/
│       ├── db.js
│       └── fixtures.js

frontend/
├── tests/
│   ├── unit/
│   │   ├── api.test.ts
│   │   └── components.test.tsx
│   └── integration/
│       ├── marketplace.test.tsx
│       └── reservas.test.tsx
```

---

## 3. Tests Unitários

### 3.1 Testes de Serviços - PedidoAula

**Ficheiro:** `backend/tests/unit/pedidosaula.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getAllPedidosAula, getPedidosPendentes, createPedidoAula, approvePedidoAula, rejectPedidoAula } from '../../src/services/pedidosaula.service.js';
import { prisma } from '../../src/config/db.js';
import { criarUtilizadorTest, criarPedidoTest, limparDadosTest } from '../helpers/db.js';

describe('Serviço PedidoAula', () => {
  let utilizadorTest;
  let disponibilidadeTest;
  let salaTest;

  beforeAll(async () => {
    utilizadorTest = await criarUtilizadorTest({ role: 'ENCARREGADO' });
    disponibilidadeTest = await prisma.disponibilidade.create({ /* dados teste */ });
    salaTest = await prisma.sala.create({ /* dados teste */ });
  });

  afterAll(async () => {
    await limparDadosTest();
  });

  describe('criarPedidoAula', () => {
    it('deve criar um pedido de aula com sucesso', async () => {
      const pedido = await createPedidoAula({
        data: '2026-05-01',
        horainicio: '10:00',
        disponibilidadeiddisponibilidade: disponibilidadeTest.iddisponibilidade,
        salaidsala: salaTest.idsala,
        encarregadoeducacaoutilizadoriduser: utilizadorTest.iduser
      });

      expect(pedido).toBeDefined();
      expect(pedido.datapedido).toBeDefined();
      expect(pedido.estado?.tipoestado).toBe('PENDENTE');
    });

    it('deve falhar se data for no passado', async () => {
      await expect(createPedidoAula({
        data: '2020-01-01',
        /* ...outros campos */
      })).rejects.toThrow('Data inválida');
    });
  });

  describe('getPedidosPendentes', () => {
    it('deve retornar apenas pedidos pendentes', async () => {
      await createPedidoAula({ /* dados */ });
      const pendentes = await getPedidosPendentes();

      expect(pendentes).toBeInstanceOf(Array);
      pendentes.forEach(p => {
        expect(p.estado.tipoestado).toBe('PENDENTE');
      });
    });
  });

  describe('approvePedidoAula', () => {
    it('deve aprovar pedido e criar aula associada', async () => {
      const pedido = await criarPedidoTest();
      const aprovado = await approvePedidoAula(pedido.idpedidoaula, utilizadorTest.iduser);

      expect(aprovado.estado.tipoestado).toBe('APROVADO');
      
      const aula = await prisma.aula.findFirst({
        where: { pedidodeaulaidpedidoaula: pedido.idpedidoaula }
      });
      expect(aula).toBeDefined();
    });
  });
});
```

**Porquê este código:**
- Valida lógica de negócio sem dependências de rede
- Execução rápida (< 100ms por teste)
- Isola erros de lógica dos fluxos HTTP

---

### 3.2 Testes de Serviços - AluguerFigurino

**Ficheiro:** `backend/tests/unit/aluguerFigurino.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { criarReserva, getDisponibilidadeFigurino, getReservasByUser, atualizarReservaEstado } from '../../src/services/aluguerFigurino.service.js';
import { prisma } from '../../src/config/db.js';

describe('Serviço AluguerFigurino', () => {
  let anuncioTest;
  let utilizadorTest;

  beforeAll(async () => {
    const figurino = await prisma.figurino.create({ /* dados */ });
    anuncioTest = await prisma.anuncio.create({
      data: { quantidade: 10, /* ... */ }
    });
    utilizadorTest = await criarUtilizadorTest({ role: 'DIRECAO' });
  });

  describe('criarReserva', () => {
    it('deve criar reserva corretamente', async () => {
      const reserva = await criarReserva({
        quantidade: 2,
        datatransacao: '2026-06-01',
        anuncioidanuncio: anuncioTest.idanuncio,
        itemfigurinoiditem: 1,
        direcaoutilizadoriduser: utilizadorTest.iduser
      });

      expect(reserva.quantidade).toBe(2);
      expect(reserva.anuncioidanuncio).toBe(anuncioTest.idanuncio);
    });

    it('deve falhar se quantidade exceedsdisponibilidade', async () => {
      await expect(criarReserva({
        quantidade: 100, // Maior que disponível
        /* ...outros campos */
      })).rejects.toThrow('quantidade disponível');
    });
  });

  describe('getDisponibilidadeFigurino', () => {
    it('deve calcular disponibilidade corretamente', async () => {
      await criarReserva({ quantidade: 3, /* ... */ });
      
      const disp = await getDisponibilidadeFigurino(anuncioTest.idanuncio);
      
      expect(disp.total).toBe(10);
      expect(disp.reservado).toBe(3);
      expect(disp.disponivel).toBe(7);
    });
  });
});
```

**Porquê este código:**
- Testa lógica de reservas independentemente da API
- Valida cálculo de disponibilidade
- Execução isolada de base de dados real

---

## 4. Testes de Integração

### 4.1 Teste de Integração - BPMN PedidoAula

**Ficheiro:** `backend/tests/integration/bpmn-pedidoaula.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { criarUtilizadorTest, criarTokenTest, limparDadosTest } from '../helpers/db.js';

describe('BPMN PedidoAula - Fluxo Completo', () => {
  let tokenEncarregado;
  let tokenProfessor;
  let utilizadorEncarregado;
  let utilizadorProfessor;

  beforeAll(async () => {
    utilizadorEncarregado = await criarUtilizadorTest({ role: 'ENCARREGADO' });
    utilizadorProfessor = await criarUtilizadorTest({ role: 'PROFESSOR' });
    tokenEncarregado = criarTokenTest(utilizadorEncarregado);
    tokenProfessor = criarTokenTest(utilizadorProfessor);
  });

  afterAll(async () => {
    await limparDadosTest();
  });

  describe('Fluxo Completo: Criar → Aprovar → Notificação', () => {
    it('1. Encarregado cria pedido (POST /api/pedidosaula)', async () => {
      const resposta = await request(app)
        .post('/api/pedidosaula')
        .set('Authorization', `Bearer ${tokenEncarregado}`)
        .send({
          data: '2026-06-01',
          horainicio: '14:00',
          disponibilidadeiddisponibilidade: 1,
          salaidsala: 1
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body.success).toBe(true);
      expect(resposta.body.data.estado.tipoestado).toBe('PENDENTE');
    });

    it('2. Professor aprova pedido (POST /api/pedidosaula/:id/approve)', async () => {
      const pedido = await criarPedidoTest();
      
      const resposta = await request(app)
        .post(`/api/pedidosaula/${pedido.idpedidoaula}/approve`)
        .set('Authorization', `Bearer ${tokenProfessor}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.data.estado.tipoestado).toBe('APROVADO');
    });

    it('3. Verifica notificação criada', async () => {
      const notifs = await request(app)
        .get('/api/notificacoes')
        .set('Authorization', `Bearer ${tokenEncarregado}`);

      expect(notifs.body.data.some(n => n.tipo.includes('PEDIDO_APROVADO'))).toBe(true);
    });

    it('4. Timer 3h rejeita automaticamente após limite', async () => {
      // Simula pedido com mais de 3 horas
      const pedidoAntigo = await criarPedidoComTempo(4); // 4 horas atrás
      
      await pedidoScheduler(); // Executa o scheduler
      
      const pedidoAtualizado = await prisma.pedidodeaula.findUnique({
        where: { idpedidoaula: pedidoAntigo.idpedidoaula }
      });
      
      expect(pedidoAtualizado.estado.tipoestado).toBe('REJEITADO');
    });
  });
});
```

**Porquê este código:**
- Testa o fluxo BPMN completo de ponta a ponta
- Valida todas as integrações entre serviços
- Verifica automação (timer 3h)

---

### 4.2 Teste de Integração - BPMN CriarAnuncio

**Ficheiro:** `backend/tests/integration/bpmn-criaranuncio.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';

describe('BPMN CriarAnuncio - Fluxo Completo', () => {
  let tokenEncarregado;
  let tokenDirecao;

  beforeAll(async () => {
    const encarregado = await criarUtilizadorTest({ role: 'ENCARREGADO' });
    const direcao = await criarUtilizadorTest({ role: 'DIRECAO' });
    tokenEncarregado = criarTokenTest(encarregado);
    tokenDirecao = criarTokenTest(direcao);
  });

  describe('Fluxo: Criar Anúncio → Moderação → Notificação', () => {
    it('1. Encarregado cria anúncio (POST /api/anuncios)', async () => {
      const resposta = await request(app)
        .post('/api/anuncios')
        .set('Authorization', `Bearer ${tokenEncarregado}`)
        .send({
          valor: 50,
          dataanuncio: '2026-06-01',
          datainicio: '2026-06-01',
          datafim: '2026-12-31',
          quantidade: 5,
          figurinoidfigurino: 1
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body.data.estado.tipoestado).toBe('PENDENTE');
    });

    it('2. Direção aprova anúncio (PUT /api/anuncios/:id/approve)', async () => {
      const anuncio = await criarAnuncioTest();
      
      const resposta = await request(app)
        .put(`/api/anuncios/${anuncio.idanuncio}/approve`)
        .set('Authorization', `Bearer ${tokenDirecao}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.data.estado.tipoestado).toBe('APROVADO');
    });

    it('3. Direção rejeita anúncio (PUT /api/anuncios/:id/reject)', async () => {
      const anuncio = await criarAnuncioTest();
      
      const resposta = await request(app)
        .put(`/api/anuncios/${anuncio.idanuncio}/reject`)
        .set('Authorization', `Bearer ${tokenDirecao}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.data.estado.tipoestado).toBe('REJEITADO');
    });

    it('4. Notificação enviada após aprovação', async () => {
      const notifs = await request(app)
        .get('/api/notificacoes')
        .set('Authorization', `Bearer ${tokenEncarregado}`);

      expect(notifs.body.data.some(n => n.tipo === 'ANUNCIO_APROVADO')).toBe(true);
    });
  });

  describe('Validações de Segurança', () => {
    it('Apenas DIRECAO pode aprovar', async () => {
      const anuncio = await criarAnuncioTest();
      const tokenAluno = criarTokenTest(await criarUtilizadorTest({ role: 'ALUNO' }));
      
      const resposta = await request(app)
        .put(`/api/anuncios/${anuncio.idanuncio}/approve`)
        .set('Authorization', `Bearer ${tokenAluno}`);

      expect(resposta.status).toBe(403);
    });
  });
});
```

**Porquê este código:**
- Valida fluxo completo de moderação
- Testa permissões de角色的
- Verifica automação de notificações

---

## 5. Testes Frontend

### 5.1 Testes de Componente - Marketplace

**Ficheiro:** `frontend/tests/integration/marketplace.test.tsx`

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Marketplace } from '../pages/Marketplace';
import { AuthProvider } from '../contexts/AuthContext';

// Mock do servidor API
const server = setupServer(
  http.get('/api/anuncios', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', titulo: 'Teste', status: 'APROVADO', tipoTransacao: 'VENDA' }
      ]
    });
  }),
  http.post('/api/anuncios/:id/approve', () => {
    return HttpResponse.json({ success: true });
  })
);

describe('Marketplace - Integração', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('deve carregar e exibir anúncios', async () => {
    render(<Marketplace />, { wrapper: AuthProvider });
    
    await waitFor(() => {
      expect(screen.getByText('Teste')).toBeInTheDocument();
    });
  });

  it('deve permitir aprovardireção (ADMIN)', async () => {
    const user = userEvent.setup();
    render(<Marketplace />, { wrapper: AuthProvider });
    
    const approveButton = screen.getByRole('button', { name: /aprovar/i });
    await user.click(approveButton);
    
    await waitFor(() => {
      expect(screen.getByText('sucesso')).toBeInTheDocument();
    });
  });
});
```

**Porquê este código:**
- Testa UI com API real (via MSW)
- Valida interação utilizador
- Execução realista

---

## 6. Como Executar os Testes

### 6.1 Comandos

```bash
# Backend - Todos os testes
cd backend
npm test

# Backend - Apenas unitários
npm run test:unit

# Backend - Apenas integração
npm run test:integration

# Backend - Com coverage
npm run test:coverage

# Frontend - Todos os testes
cd frontend
npm test

# Frontend - Em modo watch
npm run test:watch

# Ambos em simultâneo
npm run test:all
```

### 6.2 Configuração package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 6.3 Ficheiro de Configuração vitest.config.js

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js']
    },
    setupFiles: ['tests/helpers/db.js'],
    hookTimeout: 10000
  }
});
```

---

## 7. Critérios de Aceitação

| Métrica | Meta |
|--------|------|
| Cobertura de código | > 80% |
| Testes passados | 100% |
| Tempo de execução | < 5 min |
| Falhas flakantes | 0% |

---

## 8. Notas Finais

- Executar testes antes de cada commit
- Coverage mandatory para novas funcionalidades
- Manter testes atualizados com código
- Usar fixtures para dados repetíveis