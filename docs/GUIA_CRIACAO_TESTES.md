# Guia de Criação de Testes - Vitest

## 1. Introdução

Este documento explica como foram criados os testes unitários e de integração para o projeto Ent'Artes utilizando **Vitest**.

---

## 2. Ferramentas e Bibliotecas

### 2.1 Vitest

**O que é:**  
Vitest é um framework de testes unitários moderno, rápido e compatível com Jest. É construído sobre o Vite e oferece uma experiência de desenvolvimento excelente.

**Versão utilizada:** `1.6.1`

**Instalação:**
```bash
npm install -D vitest
```

**Configuração no `package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 2.2 Por que Vitest?

| Característica | Descrição |
|----------------|-----------|
| **Velocidade** | Execução extremamente rápida |
| **Compatibilidade** | API compatível com Jest |
| **TypeScript** | Suporte nativo a TypeScript |
| **ESM** | Suporte a módulos ES |
| ** watch Mode** | Recarregamento automático |

---

## 3. Estrutura dos Testes

### 3.1 Localização dos Ficheiros

```
backend/tests/
├── unit/
│   ├── validacao-data.test.js        # 25 testes
│   ├── validacao-pressao.test.js     # 24 testes
│   ├── pedidosaula.service.test.js    # 17 testes
│   └── bpmn01-negative-edge.test.js   # 45 testes (NOVO)
└── integration/
    ├── bpmn-integracao.test.js       # 22 testes
    └── pedidosaula.controller.test.js # 20 testes
```

### 3.2 Padrão de Nomenclatura

- Ficheiros terminam em `.test.js`
- Cada teste tem uma descrição clara em português
- Nomenclatura: `deve_[acao]_[resultado]`

---

## 4. Tipos de Testes Criados

### 4.1 Testes Unitários

Testam funções individuais isoladamente.

**Exemplo de estrutura:**

```javascript
import { describe, it, expect } from 'vitest';

describe('Nome do Módulo/Função', () => {
  
  it('deve retornar resultado esperado quando entrada é válida', () => {
    // Arrange - Preparar dados
    const entrada = 'valor_teste';
    
    // Act - Executar a função
    const resultado = minhaFuncao(entrada);
    
    // Assert - Verificar resultado
    expect(resultado).toBe('esperado');
  });
  
  it('deve lançar erro quando entrada é inválida', () => {
    expect(() => {
      minhaFuncao(null);
    }).toThrow('Mensagem de erro');
  });
});
```

### 4.2 Testes de Integração

Testam a interação entre múltiplos componentes.

**Exemplo:**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Controller - Nome do Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Limpar mocks entre testes
  });

  it('deve retornar dados quando existe', async () => {
    // Simular comportamento
    const mockData = [{ id: 1, nome: 'Teste' }];
    
    // Executar e verificar
    expect(mockData.length).toBeGreaterThan(0);
  });
});
```

### 4.3 Testes de Validação

Testam regras de negócio e validações de entrada.

**Exemplo:**

```javascript
describe('Validações de Data', () => {
  it('deve rejeitar data no passado', () => {
    const dataPassada = '2026-04-01';
    const hoje = new Date().toISOString().split('T')[0];
    
    expect(() => {
      if (dataPassada < hoje) throw new Error('Data inválida');
    }).toThrow('Data inválida');
  });
});
```

---

## 5. Padrões de Código Utilizados

### 5.1 Describe e It

```javascript
// Grupo de testes relacionados
describe('Nome do Componente', () => {
  
  // Caso de teste individual
  it('descrição do comportamento esperado', () => {
    expect(...);
  });
  
  // Múltiplos casos
  it.each([...])('deve funcionar para %s', (valor) => {
    expect(...);
  });
});
```

### 5.2Matchers mais comuns

```javascript
// Comparação de valores
expect(valor).toBe(esperado);           // ===
expect(valor).toEqual(objeto);          // equality deep
expect(valor).toBeNull();                // null
expect(valor).toBeUndefined();          // undefined
expect(valor).toBeTruthy();             // truthy
expect(valor).toBeFalsy();              // falsy

// Numéricos
expect(valor).toBeGreaterThan(num);     // >
expect(valor).toBeLessThan(num);        // <
expect(valor).toBeGreaterThanOrEqual(num); // >=
expect(valor).toBeLessThanOrEqual(num);  // <=

// Strings
expect(texto).toContain(substring);     // includes
expect(texto).toMatch(regex);           // regex

// Arrays
expect(array).toContain(item);          // includes
expect(array).toHaveLength(num);         // length
expect(array).toEqual(expect.arrayContaining([...])); // contains

// Exceções
expect(() => func()).toThrow();         // throws
expect(() => func()).toThrow('erro');   // throws with message
```

### 5.3 Setup e Teardown

```javascript
beforeEach(() => {
  // Executa antes de cada teste
});

afterEach(() => {
  // Executa após cada teste
});

beforeAll(() => {
  // Executa uma vez antes de todos os testes
});

afterAll(() => {
  // Executa uma vez após todos os testes
});
```

### 5.4 Mocks

```javascript
// Criar mock de função
const minhaFuncao = vi.fn();

// Definir comportamento
minhaFuncao.mockReturnValue('valor');
minhaFuncao.mockResolvedValue('valor async');

// Verificar chamada
expect(minhaFuncao).toHaveBeenCalled();
expect(minhaFuncao).toHaveBeenCalledWith(arg1, arg2);
expect(minhaFuncao).toHaveBeenCalledTimes(1);
```

---

## 6. Como Criar Novos Testes

### 6.1 Template Básico

```javascript
import { describe, it, expect } from 'vitest';

describe('Nome do Módulo', () => {
  
  describe('Função/Metodo especifico', () => {
    
    it('deve [resultado] quando [condição]', () => {
      // Arrange
      const input = 'valor';
      
      // Act
      const output = funcao(input);
      
      // Assert
      expect(output).toBe('esperado');
    });
    
    it('deve lançar erro quando [condição de erro]', () => {
      expect(() => {
        funcao(inputInvalido);
      }).toThrow('mensagem');
    });
  });
});
```

### 6.2 Criar Teste de Validação

```javascript
describe('Validação de Campo', () => {
  const validarCampo = (valor) => {
    if (!valor) throw new Error('Campo obrigatório');
    if (typeof valor !== 'string') throw new Error('Tipo inválido');
    return true;
  };

  it('deve aceitar valor válido', () => {
    expect(validarCampo('teste')).toBe(true);
  });

  it('deve rejeitar valor vazio', () => {
    expect(() => validarCampo('')).toThrow('Campo obrigatório');
  });

  it('deve rejeitar tipo inválido', () => {
    expect(() => validarCampo(123)).toThrow('Tipo inválido');
  });
});
```

### 6.3 Criar Teste de Integração

```javascript
describe('Endpoint - GET /api/recurso', () => {
  
  it('deve retornar lista de recursos', async () => {
    // Simular dados
    const mockRecursos = [
      { id: 1, nome: 'Recurso 1' },
      { id: 2, nome: 'Recurso 2' }
    ];
    
    // Verificar estrutura
    expect(mockRecursos).toHaveLength(2);
    expect(mockRecursos[0]).toHaveProperty('id');
    expect(mockRecursos[0]).toHaveProperty('nome');
  });
  
  it('deve retornar vazio quando não existem recursos', () => {
    const recursos = [];
    expect(recursos).toEqual([]);
    expect(recursos.length).toBe(0);
  });
});
```

---

## 7. Casos de Teste para BPMN01

### 7.1 Validações de Entrada

```javascript
describe('Validações de Entrada', () => {
  // Data não pode ser vazia
  // Hora não pode ser vazia
  // Duração deve ser positiva
  // Duração não pode exceder limite
});
```

### 7.2 Fluxo de Criação de Pedido

```javascript
describe('Criar Pedido de Aula', () => {
  // Deve criar com dados válidos
  // Deve rejeitar data no passado
  // Deve rejeitar sem disponibilidade
  // Deve rejeitar sem sala
});
```

### 7.3 Aprovação/Rejeição

```javascriptdescribe('Aprovação pelo Direção', () => {
  // Deve aprovar pedido válido
  // Deve rejeitar com motivo
  // Não pode aprovar duas vezes
});
```

### 7.4 Negative Testing

```javascript
describe('Negative Testing', () => {
  // Todos os casos de erro
  // Campos obrigatórios
  // Limites e fronteiras
});
```

---

## 8. Executar Testes

### 8.1 Comandos

```bash
# Todos os testes
npm test
# ou
npx vitest run

# Modo watch (re executa ao guardar)
npx vitest

# Saída detalhada
npx vitest run --reporter=verbose

# Ficheiro específico
npx vitest run tests/unit/validacao-data.test.js
```

### 8.2 Filtrar por nome

```bash
npx vitest run --grep "BPMN01"
```

---

## 9. Boas Práticas

### 9.1 Nomenclatura

- Use descrições claras em português
- Formato: `deve [resultado] quando [condição]`
- Exemplo: `deve retornar erro quando data é passada`

### 9.2 Estrutura AAA

```
Arrange → Act → Assert
```

1. **Arrange**: Preparar dados de entrada
2. **Act**: Executar a função/teste
3. **Assert**: Verificar o resultado

### 9.3 Isolamento

- Cada teste deve ser independente
- Não dependa de ordem de execução
- Limpe estado entre testes

### 9.4 Cobertura

- Teste happy path (caso ideal)
- Teste edge cases (limites)
- Teste error cases (erros)

---

## 10. Perguntas Frequentes na Defesa

### P: Por que escolheram Vitest?

**R:** Vitest foi escolhido porque:
1. Integração nativa com Vite (já usado no projeto)
2. Velocidade de execução muito superior ao Jest
3. Suporte nativo a TypeScript
4. API compatível com Jest (curva de aprendizagem pequena)
5. Comunidade ativa e bem documentada

### P: Qual a diferença entre teste unitário e integração?

**R:**
- **Unitário**: Testa uma função/componente isoladamente. Ex: validar se a função `validarData()` retorna erro para data passada.
- **Integração**: Testa a interação entre múltiplos componentes. Ex: testar se o endpoint `/api/pedidos` retorna os dados corretos do banco.

### P: Como garantem a qualidade dos testes?

**R:**
1. **Cobertura**: 153 testes cobrindo validações, fluxos e casos de erro
2. **Diversidade**: Testes unitários, integração, validação, pressão e negative testing
3. **Automação**: Todos os testes correm automaticamente
4. **Manutenção**: Estrutura clara e bem documentada

### P: O que são Negative Tests?

**R:** São testes que verificam o comportamento quando algo dá errado:
- Dados inválidos
- Campos obrigatórios em falta
- Limites excedidos
- Transições de estado inválidas

### P: Como lidam com dependências externas nos testes?

**R:** Utilizamos **mocks** para simular dependências:
- `vi.fn()` para funções
- `vi.mock()` para módulos
- Dados simulados (mock data) para respostas de API

---

## 11. Estatísticas dos Testes

| Tipo | Quantidade | Percentagem |
|------|------------|-------------|
| Testes Unitários | 111 | 73% |
| Testes Integração | 42 | 27% |
| **Total** | **153** | **100%** |

### Por Categoria

| Categoria | Testes |
|-----------|--------|
| Validação de Dados | 25 |
| Testes de Pressão | 24 |
| BPMN Integração | 22 |
| Controller | 20 |
| Service | 17 |
| Negative/Edge Cases | 45 |

---

## 12. Conclusão

Os testes foram criados seguindo as melhores práticas de desenvolvimento de software:

✅ **Testes são automáticos**  
✅ **Código é legível e manutenível**  
✅ **Cobertura abrangente**  
✅ **Documentação completa**  

Isto permite garantir a qualidade do código e facilita a manutenção futura do projeto.