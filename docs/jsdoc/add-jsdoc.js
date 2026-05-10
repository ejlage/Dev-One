#!/usr/bin/env node

/**
 * Script para adicionar JSDoc automaticamente aos ficheiros de serviço.
 * Usage: node scripts/add-jsdoc.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const servicesDir = path.join(__dirname, '../src/services');

// Ficheiros a ignorar
const ignoreFiles = [
  'notificacoes.service.js',  // Já tem documentação
  'email.service.js',          // Não é serviço de dados
  'pedidoaula.scheduler.js'   // Scheduler
];

// Mais funções para mapping
const functionDescriptions = {
  // aulas.service.js
  'listarAulas': { desc: 'Lista todas as aulas', params: '', returns: '{Promise<object[]>}' },
  'consultarAula': { desc: 'Consulta uma aula pelo ID', params: '@param {string|number} id - ID da aula', returns: '{Promise<object|null>}' },
  'obterAulaDoPedido': { desc: 'Obtém aula associada a um pedido', params: '@param {string|number} pedidoId - ID do pedido', returns: '{Promise<object|null>}' },
  'criarAula': { desc: 'Cria uma nova aula', params: '@param {object} data - Dados da aula', returns: '{Promise<object>}' },
  'updateAula': { desc: 'Atualiza uma aula', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteAula': { desc: 'Elimina uma aula', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'confirmAula': { desc: 'Confirma uma aula', params: '@param {string|number} id', returns: '{Promise<object>}' },
  'cancelarAula': { desc: 'Cancela uma aula', params: '@param {string|number} id', returns: '{Promise<object>}' },
  'remarcarAula': { desc: 'Remarca uma aula', params: '@param {string|number} id @param {string} newData @param {string} newHora', returns: '{Promise<object>}' },
  'responderSugestaoProfessor': { desc: 'Responde a sugestão do professor', params: '@param {string|number} aulaId @param {boolean} aceitar', returns: '{Promise<object>}' },
  'responderSugestaoEE': { desc: 'Responde a sugestão do encarregado', params: '@param {string|number} aulaId @param {boolean} aceitar', returns: '{Promise<object>}' },
  'inserirAlunoAula': { desc: 'Insere aluno numa aula', params: '@param {string|number} aulaId @param {number} alunoId', returns: '{Promise<object>}' },
  'pedirRemarcacao': { desc: 'Professor pede remarcação', params: '@param {string|number} pedidoId @param {number} professorUserId', returns: '{Promise<object>}' },
  'sugerirNovaData': { desc: 'Sugere nova data para aula', params: '@param {string|number} pedidoId @param {string} novaData', returns: '{Promise<object>}' },
  'responderSugestaoDirecao': { desc: 'Responde a sugestão da direção', params: '@param {string|number} aulaId @param {boolean} aceitar', returns: '{Promise<object>}' },
  'getEstadoAulaByName': { desc: 'Obtém estado da aula pelo nome', params: '@param {string} nome', returns: '{Promise<object>}' },

  // encarregado.service.js
  'getEncarregadoAulas': { desc: 'Obtém aulas do encarregado', params: '@param {number} encarregadoUserId', returns: '{Promise<object[]>}' },
  'submeterPedidoAula': { desc: 'Submete pedido de aula', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'cancelarParticipacaoAula': { desc: 'Cancela participação em aula', params: '@param {string|number} pedidoId @param {number} userId', returns: '{Promise<object>}' },
  'inserirAlunoPedido': { desc: 'Insere aluno num pedido', params: '@param {string|number} pedidoId @param {number} alunoId', returns: '{Promise<object>}' },

  // direcao.service.js
  'avaliarPedido': { desc: 'Avalia pedido de aula', params: '@param {string|number} id @param {string} decisao @param {number} userId', returns: '{Promise<object>}' },
  'getAllPedidosEAulas': { desc: 'Obtém todos os pedidos e aulas', params: '', returns: '{Promise<object[]>}' },

  // professor.service.js
  'getProfessorAulas': { desc: 'Obtém aulas do professor', params: '@param {number} professorId', returns: '{Promise<object[]>}' },
  'get ProfessorDisponibilidades': { desc: 'Obtém disponibilidades do professor', params: '@param {number} userId', returns: '{Promise<object[]>}' },
  'verificarDisponibilidadeProfessor': { desc: 'Verifica disponibilidade do professor', params: '@param {number} professorId @param {string} data', returns: '{Promise<object[]>}' },
  'criarDisponibilidade': { desc: 'Cria disponibilidade', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'updateDisponibilidade': { desc: 'Atualiza disponibilidade', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteDisponibilidade': { desc: 'Elimina disponibilidade', params: '@param {string|number} id @param {number} userId', returns: '{Promise<void>}' },

  // aluno.service.js
  'getAlunoAulas': { desc: 'Obtém aulas do aluno', params: '@param {number} userId', returns: '{Promise<object[]>}' },
  'getAlunoDisponibilidades': { desc: 'Obtém disponibilidades para aluno', params: '@param {number} userId', returns: '{Promise<object[]>}' },

  // anuncios.service.js
  'getAllAnuncios': { desc: 'Obtém todos os anúncios', params: '', returns: '{Promise<object[]>}' },
  'consultarAnuncio': { desc: 'Consulta anúncio pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'registarAnuncio': { desc: 'Regista novo anúncio', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'updateAnuncio': { desc: 'Atualiza anúncio', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteAnuncio': { desc: 'Elimina anúncio', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'avaliarAnuncio': { desc: 'Avalia anúncio', params: '@param {string|number} id @param {boolean} aprobar @param {number} userId', returns: '{Promise<object>}' },
  'ressubmeterAnuncio': { desc: 'Ressubmete anúncio', params: '@param {string|number} id @param {number} userId', returns: '{Promise<object>}' },

  // aluguerFigurino.service.js
  'getAllTransacoes': { desc: 'Obtém todas as transações', params: '', returns: '{Promise<object[]>}' },
  'getTransacaoById': { desc: 'Obtém transação pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'registarTransacao': { desc: 'Regista transação', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'avaliarPedidoReserva': { desc: 'Avalia pedido de reserva', params: '@param {string|number} id @param {string} decisao @param {number} userId', returns: '{Promise<object>}' },
  'confirmarReserva': { desc: 'Confirma reserva', params: '@param {string|number} id @param {number} userId', returns: '{Promise<object>}' },
  'cancelarReserva': { desc: 'Cancela reserva', params: '@param {string|number} id @param {number} userId', returns: '{Promise<object>}' },
  'getReservasByUser': { desc: 'Obtém reservas do utilizador', params: '@param {number} userId', returns: '{Promise<object[]>}' },
  'getDisponibilidade': { desc: 'Obtém disponibilidade de figurino', params: '@param {string|number} anuncioId', returns: '{Promise<object>}' },

  // figurinos.service.js
  'getAllFigurinos': { desc: 'Obtém todos os figurinos', params: '', returns: '{Promise<object[]>}' },
  'getFigurinoById': { desc: 'Obtém figurino pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'createFigurino': { desc: 'Cria figurino', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'updateFigurino': { desc: 'Atualiza figurino', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteFigurino': { desc: 'Elimina figurino', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'updateFigurinoStatusSimple': { desc: 'Atualiza estado do figurino', params: '@param {string|number} id @param {number} estadousoid', returns: '{Promise<object>}' },

  // eventos.service.js
  'getAllEventos': { desc: 'Obtém todos os eventos', params: '', returns: '{Promise<object[]>}' },
  'getEventoById': { desc: 'Obtém evento pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'createEvento': { desc: 'Cria evento', params: '@param {object} data @param {number} userId', returns: '{Promise<object>}' },
  'updateEvento': { desc: 'Atualiza evento', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteEvento': { desc: 'Elimina evento', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'publishEvento': { desc: 'Publica/despublica evento', params: '@param {string|number} id', returns: '{Promise<object>}' },

  // turmas.service.js
  'getAllGrupos': { desc: 'Obtém todos os grupos', params: '', returns: '{Promise<object[]>}' },
  'getGrupoById': { desc: 'Obtém grupo pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'createGrupo': { desc: 'Cria grupo', params: '@param {object} data', returns: '{Promise<object>}' },
  'updateGrupo': { desc: 'Atualiza grupo', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteGrupo': { desc: 'Elimina grupo', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'inscreverAluno': { desc: 'Inscreve aluno no grupo', params: '@param {string|number} grupoId @param {number} alunoId', returns: '{Promise<object>}' },
  'removerAluno': { desc: 'Remove aluno do grupo', params: '@param {string|number} grupoId @param {number} alunoId', returns: '{Promise<void>}' },
  'getGruposByAluno': { desc: 'Obtém grupos do aluno', params: '@param {number} alunoId', returns: '{Promise<object[]>}' },

  // users.service.js
  'getAllUsers': { desc: 'Obtém todos os utilizadores', params: '', returns: '{Promise<object[]>}' },
  'getUserById': { desc: 'Obtém utilizador pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'createUser': { desc: 'Cria utilizador', params: '@param {object} data', returns: '{Promise<object>}' },
  'updateUser': { desc: 'Atualiza utilizador', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteUser': { desc: 'Elimina utilizador', params: '@param {string|number} id', returns: '{Promise<void>}' },

  // salas.service.js
  'getAllSalas': { desc: 'Obtém todas as salas', params: '', returns: '{Promise<object[]>}' },
  'getSalaById': { desc: 'Obtém sala pelo ID', params: '@param {string|number} id', returns: '{Promise<object|null>}' },
  'createSala': { desc: 'Cria sala', params: '@param {object} data', returns: '{Promise<object>}' },
  'updateSala': { desc: 'Atualiza sala', params: '@param {string|number} id @param {object} data', returns: '{Promise<object>}' },
  'deleteSala': { desc: 'Elimina sala', params: '@param {string|number} id', returns: '{Promise<void>}' },
  'consultarSalaDisponivel': { desc: 'Verifica disponibilidade de sala', params: '@param {string} data @param {string} hora @param {number} duracao', returns: '{Promise<object>}' },

  // professor-aulas.service.js
  'getProfessorAulasWithFilters': { desc: 'Obtém aulas com filtros', params: '@param {number} professorId @param {object} filtros', returns: '{Promise<object[]>}' },

  // pedidoaula.service.js (scheduler)
  'autoRejectExpired': { desc: 'Rejeita automaticamente pedidos expirados', params: '', returns: '{Promise<void>}' },
};

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const newLines = [];
  let modified = false;
  let hasJsdoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar se já tem JSDoc
    if (line.includes('/**')) {
      hasJsdoc = true;
    }

    // Procura export const funcName = async
    const match = line.match(/^export const (\w+) = async/);
    if (match) {
      const funcName = match[1];
      const desc = functionDescriptions[funcName];
      
      // Se tem descrição e linha anterior não é JSDoc
      if (desc && !hasJsdoc) {
        const jsdoc = `/**
 * ${desc.desc}.
 * ${desc.params}
 * @returns {Promise<any>} ${desc.returns}
 */
`;
        newLines.push(jsdoc);
        modified = true;
        hasJsdoc = true;
      } else {
        newLines.push(line);
        hasJsdoc = false;
      }
    } else {
      newLines.push(line);
      // Reset flag se não estamos num bloco de JSDoc
      if (!line.includes('/**') && !line.includes('*') && !line.includes('*/')) {
        hasJsdoc = false;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    console.log(`✅ Atualizado: ${path.basename(filePath)}`);
  } else {
    console.log(`⏭️  Ignorado: ${path.basename(filePath)} (sem alterações)`);
  }
}

// Main
console.log('🔧 Adicionando JSDoc aos serviços...\n');

const files = fs.readdirSync(servicesDir)
  .filter(f => f.endsWith('.service.js'))
  .filter(f => !ignoreFiles.includes(f));

for (const file of files) {
  processFile(path.join(servicesDir, file));
}

console.log('\n✅ Concluído!');