// Tipos e interfaces do sistema

export type UserRole = 'ALUNO' | 'ENCARREGADO' | 'PROFESSOR' | 'DIRECAO';

export interface Notificacao {
  idnotificacao: number;
  mensagem: string;
  tipo: string;
  lida: boolean;
  datanotificacao: string;
  dataleitura: string | null;
}

export type AulaStatus = 'PENDENTE' | 'CONFIRMADA' | 'REJEITADA' | 'REALIZADA';

export type FigurinoStatus = 'DISPONIVEL' | 'ALUGADO' | 'VENDIDO';

export type AnuncioStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export type TipoTransacao = 'VENDA' | 'ALUGUER';

export type ReservaFigurinoStatus = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface User {
  id: string;
  nome: string;
  email: string;
  telemovel?: string;
  role: UserRole;
  estado?: boolean; // true = ativo, false = inativo
  encarregadoId?: string; // Se for ALUNO, referência ao encarregado
  alunosIds?: string[]; // Se for ENCARREGADO, lista de alunos
}

export interface PedidoAula {
  id: string;
  alunoId: string;
  alunoNome: string;
  encarregadoId: string;
  professorId: string;
  professorNome: string;
  estudioId: string;
  estudioNome: string;
  modalidade: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  duracao: number;
  status: AulaStatus;
  observacoes?: string;
  motivoRejeicao?: string;
  criadoEm: string;
  validadaFaturacao?: boolean;
  valorAula?: number;
  dataValidacao?: string;
  // Suporte a múltiplos alunos na mesma aula
  participantes?: { alunoId: string; alunoNome: string; encarregadoId?: string }[];
  maxParticipantes?: number;
  privacidade?: boolean;
  encarregadoNome?: string;
  sugestaoestado?: string | null;
  novadata?: string | null;
  novaData?: string | null;
}

export interface Figurino {
  id: string;
  nome: string;
  descricao: string;
  tamanho: string;
  imagem: string;
  status: FigurinoStatus;
  tipo: 'ESCOLA' | 'PARTICULAR';
  proprietarioId?: string; // Se for particular
  proprietarioNome?: string;
  alugadoPor?: string; // ID do usuário que alugou
  alugadoEm?: string; // Data do aluguel
  alugadoAte?: string; // Data prevista de devolução
  localArmazenamento?: string; // Local físico onde está guardado (prateleira, armário, etc)
}

export interface AnuncioMarketplace {
  id: string;
  titulo: string;
  descricao: string;
  preco: number;
  imagem: string;
  vendedorId: string;
  vendedorNome: string;
  vendedorContato: string;
  vendedorEmail: string;
  status: AnuncioStatus;
  tipoTransacao: TipoTransacao;
  criadoEm: string;
  espetaculoId?: string; // Se é para um espetáculo específico
  espetaculoNome?: string;
  stockAssociadoId?: string; // ID do figurino do stock (se é aluguer da escola)
  motivoRejeicao?: string | null;
}

export interface ReservaFigurino {
  id: string;
  anunciosId: string;
  anunciosTitulo: string;
  usuarioId: number | string;
  usuarioNome: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  criadoEm: string;
  motivoRejeicao?: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem: string;
  linkBilhetes?: string; // Ticketline
  destaque: boolean;
}

export interface Estudio {
  id: string;
  nome: string;
  capacidade: number;
}

export interface SlotDisponibilidade {
  id: string;
  professorId: string;
  professorNome: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  duracao: number;
  maxDuracao: number;
  minutosOcupados: number;
  estudioId: string;
  estudioNome: string;
  modalidade: string;
  modalidadeId?: string;
}

export type TurmaStatus = 'ABERTA' | 'FECHADA' | 'ARQUIVADA';
export type NivelTurma = 'Iniciante' | 'Intermédio' | 'Avançado' | 'Todos os níveis';

export interface AlunoInscrito {
  alunoId: string;
  alunoNome: string;
  encarregadoId: string;
  inscritoEm: string;
}

export interface Turma {
  id: string;
  nome: string;
  modalidade: string;
  descricao: string;           // texto livre — define o professor
  nivel: NivelTurma;
  faixaEtaria: string;         // ex: "6-10 anos", "Adultos"
  professorId: string;
  professorNome: string;
  estudioId: string;
  estudioNome: string;
  diasSemana: number[];        // 1=Seg … 6=Sáb
  horaInicio: string;
  horaFim: string;
  duracao: number;
  lotacaoMaxima: number;
  preco?: number;              // valor mensal opcional
  dataInicio: string;
  dataFim?: string;
  status: TurmaStatus;
  cor: string;                 // cor do banner do card (hex)
  requisitos?: string;         // notas / requisitos visíveis ao encarregado
  alunosInscritos: AlunoInscrito[];
  criadaEm: string;
}