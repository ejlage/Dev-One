import {
  User, PedidoAula, Figurino, AnuncioMarketplace, ReservaFigurino,
  Evento, Estudio, SlotDisponibilidade, Turma
} from '../types';

// Dados mock de utilizadores
export const mockUsers: User[] = [
  {
    id: 'dir1',
    nome: 'Maria Silva',
    email: 'direcao@entartes.pt',
    role: 'DIRECAO'
  },
  {
    id: 'prof1',
    nome: 'João Santos',
    email: 'joao.santos@entartes.pt',
    role: 'PROFESSOR'
  },
  {
    id: 'prof2',
    nome: 'Ana Costa',
    email: 'ana.costa@entartes.pt',
    role: 'PROFESSOR'
  },
  {
    id: 'prof3',
    nome: 'Carlos Mendes',
    email: 'carlos.mendes@entartes.pt',
    role: 'PROFESSOR'
  },
  {
    id: 'enc1',
    nome: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.pt',
    role: 'ENCARREGADO',
    alunosIds: ['aluno1', 'aluno2']
  },
  {
    id: 'enc2',
    nome: 'Sofia Rodrigues',
    email: 'sofia.rodrigues@email.pt',
    role: 'ENCARREGADO',
    alunosIds: ['aluno3']
  },
  {
    id: 'enc3',
    nome: 'Ricardo Ferreira',
    email: 'ricardo.ferreira@email.pt',
    role: 'ENCARREGADO',
    alunosIds: ['aluno4', 'aluno5']
  },
  {
    id: 'aluno1',
    nome: 'Miguel Oliveira',
    email: 'miguel.oliveira@email.pt',
    role: 'ALUNO',
    encarregadoId: 'enc1'
  },
  {
    id: 'aluno2',
    nome: 'Sofia Oliveira',
    email: 'sofia.o@email.pt',
    role: 'ALUNO',
    encarregadoId: 'enc1'
  },
  {
    id: 'aluno3',
    nome: 'Lucas Rodrigues',
    email: 'lucas.rodrigues@email.pt',
    role: 'ALUNO',
    encarregadoId: 'enc2'
  },
  {
    id: 'aluno4',
    nome: 'Beatriz Ferreira',
    email: 'beatriz.ferreira@email.pt',
    role: 'ALUNO',
    encarregadoId: 'enc3'
  },
  {
    id: 'aluno5',
    nome: 'Tomás Ferreira',
    email: 'tomas.ferreira@email.pt',
    role: 'ALUNO',
    encarregadoId: 'enc3'
  }
];

// Estúdios disponíveis
export const mockEstudios: Estudio[] = [
  { id: 'est1', nome: 'Estúdio Principal', capacidade: 20 },
  { id: 'est2', nome: 'Estúdio Pequeno', capacidade: 10 },
  { id: 'est3', nome: 'Sala de Ensaio', capacidade: 15 }
];

// Pedidos de aulas
export const mockPedidosAulas: PedidoAula[] = [
  {
    id: 'aula1',
    alunoId: 'aluno1',
    alunoNome: 'Miguel Oliveira',
    encarregadoId: 'enc1',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Hip-Hop',
    data: '2026-03-15',
    horaInicio: '14:00',
    horaFim: '15:00',
    duracao: 60,
    status: 'PENDENTE',
    observacoes: 'Primeira aula de hip-hop',
    criadoEm: '2026-03-01T10:00:00',
    participantes: [
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira', encarregadoId: 'enc1' },
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues', encarregadoId: 'enc2' },
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira', encarregadoId: 'enc3' }
    ]
  },
  {
    id: 'aula2',
    alunoId: 'aluno2',
    alunoNome: 'Sofia Oliveira',
    encarregadoId: 'enc1',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Ballet',
    data: '2026-03-16',
    horaInicio: '16:00',
    horaFim: '17:30',
    duracao: 90,
    status: 'CONFIRMADA',
    observacoes: 'Aula de ballet clássico',
    criadoEm: '2026-02-28T15:00:00',
    participantes: [
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira', encarregadoId: 'enc1' },
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3' }
    ]
  },
  {
    id: 'aula3',
    alunoId: 'aluno3',
    alunoNome: 'Lucas Rodrigues',
    encarregadoId: 'enc2',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Hip-Hop',
    data: '2026-03-17',
    horaInicio: '10:00',
    horaFim: '11:00',
    duracao: 60,
    status: 'CONFIRMADA',
    observacoes: 'Aula de hip-hop iniciante',
    criadoEm: '2026-02-25T09:00:00',
    participantes: [
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues', encarregadoId: 'enc2' },
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira', encarregadoId: 'enc1' },
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira', encarregadoId: 'enc3' }
    ]
  },
  {
    id: 'aula4',
    alunoId: 'aluno4',
    alunoNome: 'Beatriz Ferreira',
    encarregadoId: 'enc3',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    modalidade: 'Contemporâneo',
    data: '2026-03-18',
    horaInicio: '18:00',
    horaFim: '19:00',
    duracao: 60,
    status: 'PENDENTE',
    observacoes: 'Preparação para espetáculo',
    criadoEm: '2026-03-02T08:00:00',
    participantes: [
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3' },
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira', encarregadoId: 'enc3' }
    ]
  },
  {
    id: 'aula5',
    alunoId: 'aluno5',
    alunoNome: 'Tomás Ferreira',
    encarregadoId: 'enc3',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Contemporâneo',
    data: '2026-03-19',
    horaInicio: '15:00',
    horaFim: '16:00',
    duracao: 60,
    status: 'CONFIRMADA',
    observacoes: 'Aula de dança contemporânea',
    criadoEm: '2026-02-20T10:00:00',
    participantes: [
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira', encarregadoId: 'enc3' },
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira', encarregadoId: 'enc1' },
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues', encarregadoId: 'enc2' },
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3' }
    ]
  },
  {
    id: 'aula9',
    alunoId: 'aluno4',
    alunoNome: 'Beatriz Ferreira',
    encarregadoId: 'enc3',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    modalidade: 'Jazz',
    data: '2026-03-20',
    horaInicio: '11:00',
    horaFim: '12:00',
    duracao: 60,
    status: 'CONFIRMADA',
    observacoes: 'Treino para competição',
    criadoEm: '2026-03-05T09:00:00',
    participantes: [
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3' },
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira', encarregadoId: 'enc1' }
    ]
  },
  {
    id: 'aula11',
    alunoId: 'aluno1',
    alunoNome: 'Miguel Oliveira',
    encarregadoId: 'enc1',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Contemporâneo',
    data: '2026-03-21',
    horaInicio: '17:00',
    horaFim: '18:30',
    duracao: 90,
    status: 'PENDENTE',
    observacoes: 'Aula experimental de contemporâneo',
    criadoEm: '2026-03-06T16:00:00',
    participantes: [
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira', encarregadoId: 'enc1' }
    ]
  },
  {
    id: 'aula12',
    alunoId: 'aluno3',
    alunoNome: 'Lucas Rodrigues',
    encarregadoId: 'enc2',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    modalidade: 'Ballet',
    data: '2026-03-22',
    horaInicio: '14:30',
    horaFim: '15:30',
    duracao: 60,
    status: 'CONFIRMADA',
    observacoes: 'Ensaio para gala de ballet',
    criadoEm: '2026-03-07T11:00:00'
  },

  // ── EXEMPLOS DAS NOVAS FUNCIONALIDADES ──────────────────────────────────

  {
    id: 'aula14',
    alunoId: 'aluno2',
    alunoNome: 'Sofia Oliveira',
    encarregadoId: 'enc1',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Ballet',
    data: '2026-03-27',
    horaInicio: '10:00',
    horaFim: '11:30',
    duracao: 90,
    status: 'PENDENTE',
    observacoes: 'Aula de ballet clássico — aguarda aprovação',
    criadoEm: '2026-03-11T14:00:00',
    participantes: [
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira', encarregadoId: 'enc1' }
    ]
  },

  {
    id: 'aula15',
    alunoId: 'aluno1',
    alunoNome: 'Miguel Oliveira',
    encarregadoId: 'enc1',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Hip-Hop',
    data: '2026-03-24',
    horaInicio: '15:00',
    horaFim: '16:00',
    duracao: 60,
    status: 'PENDENTE',
    observacoes: 'Aula de hip-hop — aguarda aprovação',
    criadoEm: '2026-03-08T10:00:00',
    participantes: [
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira', encarregadoId: 'enc1' },
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues', encarregadoId: 'enc2' }
    ]
  },

  {
    id: 'aula16',
    alunoId: 'aluno3',
    alunoNome: 'Lucas Rodrigues',
    encarregadoId: 'enc2',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Jazz',
    data: '2026-03-25',
    horaInicio: '10:00',
    horaFim: '11:00',
    duracao: 60,
    status: 'PENDENTE',
    observacoes: 'Aula de jazz — aguarda aprovação',
    criadoEm: '2026-03-09T09:00:00',
    participantes: [
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues', encarregadoId: 'enc2' }
    ]
  },

  {
    id: 'aula17',
    alunoId: 'aluno4',
    alunoNome: 'Beatriz Ferreira',
    encarregadoId: 'enc3',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Ballet',
    data: '2026-03-23',
    horaInicio: '11:00',
    horaFim: '12:30',
    duracao: 90,
    status: 'PENDENTE',
    observacoes: 'Aula de ballet — aguarda aprovação',
    criadoEm: '2026-03-09T11:00:00',
    participantes: [
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3' },
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira', encarregadoId: 'enc1' }
    ]
  },

  {
    id: 'aula18',
    alunoId: 'aluno5',
    alunoNome: 'Tomás Ferreira',
    encarregadoId: 'enc3',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Contemporâneo',
    data: '2026-03-24',
    horaInicio: '14:00',
    horaFim: '15:00',
    duracao: 60,
    status: 'PENDENTE',
    observacoes: 'Aula de contemporâneo — aguarda aprovação',
    criadoEm: '2026-03-10T13:00:00',
    participantes: [
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira', encarregadoId: 'enc3' }
    ]
  }
];

// ── Turmas criadas por professores ────────────────────────────────────────────
export const mockTurmas: Turma[] = [
  {
    id: 'turma1',
    nome: 'Ballet Infantil — Iniciantes',
    modalidade: 'Ballet',
    descricao: 'Grupo de iniciação ao Ballet Clássico para crianças. Trabalhamos postura, expressão corporal e os fundamentos técnicos de forma lúdica e divertida.',
    nivel: 'Iniciante',
    faixaEtaria: '5-8 anos',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    diasSemana: [2, 4],
    horaInicio: '10:00',
    horaFim: '11:00',
    duracao: 60,
    lotacaoMaxima: 10,
    preco: 45,
    dataInicio: '2026-03-01',
    dataFim: '2026-07-31',
    status: 'ABERTA',
    cor: '#f9a8d4',
    requisitos: 'Trazer roupa de ballet (collant e sapatilhas). Cabelo preso.',
    alunosInscritos: [
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira',  encarregadoId: 'enc1', inscritoEm: '2026-02-20T10:00:00' },
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3', inscritoEm: '2026-02-22T14:00:00' }
    ],
    criadaEm: '2026-02-15T09:00:00'
  },
  {
    id: 'turma2',
    nome: 'Hip-Hop Urban — Nível 1',
    modalidade: 'Hip-Hop',
    descricao: 'Aprende os fundamentos do Hip-Hop e Dança Urbana. Aulas dinâmicas com música atual. Sem experiência prévia necessária.',
    nivel: 'Iniciante',
    faixaEtaria: '10-16 anos',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    diasSemana: [3, 6],
    horaInicio: '14:00',
    horaFim: '15:30',
    duracao: 90,
    lotacaoMaxima: 20,
    preco: 40,
    dataInicio: '2026-03-04',
    dataFim: '2026-07-31',
    status: 'ABERTA',
    cor: '#a78bfa',
    requisitos: 'Roupa desportiva confortável. Sapatilhas de borracha.',
    alunosInscritos: [
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira',  encarregadoId: 'enc1', inscritoEm: '2026-02-25T11:00:00' },
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues',  encarregadoId: 'enc2', inscritoEm: '2026-02-26T09:00:00' },
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira',   encarregadoId: 'enc3', inscritoEm: '2026-02-27T16:00:00' }
    ],
    criadaEm: '2026-02-20T10:00:00'
  },
  {
    id: 'turma3',
    nome: 'Contemporâneo Avançado',
    modalidade: 'Contemporâneo',
    descricao: 'Grupo avançado de Dança Contemporânea. Exploração de movimento, improvisação e criação coreográfica. Preparação para espetáculos e competições.',
    nivel: 'Avançado',
    faixaEtaria: 'Adultos',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    diasSemana: [2, 5],
    horaInicio: '19:00',
    horaFim: '20:30',
    duracao: 90,
    lotacaoMaxima: 15,
    preco: 55,
    dataInicio: '2026-03-03',
    status: 'ABERTA',
    cor: '#5eead4',
    requisitos: 'Mínimo 2 anos de experiência em dança. Entrevista prévia com o professor.',
    alunosInscritos: [],
    criadaEm: '2026-02-18T14:00:00'
  },
  {
    id: 'turma4',
    nome: 'Jazz para Todos',
    modalidade: 'Jazz',
    descricao: 'Grupo aberto de Jazz para todas as idades e níveis. Um espaço de alegria, ritmo e expressão. Venha dançar connosco!',
    nivel: 'Todos os níveis',
    faixaEtaria: 'Todas as idades',
    professorId: 'prof1',
    professorNome: 'João Santos',
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    diasSemana: [1, 4],
    horaInicio: '18:00',
    horaFim: '19:00',
    duracao: 60,
    lotacaoMaxima: 5,
    preco: 38,
    dataInicio: '2026-03-02',
    dataFim: '2026-06-30',
    status: 'FECHADA',
    cor: '#fbbf24',
    alunosInscritos: [
      { alunoId: 'aluno1', alunoNome: 'Miguel Oliveira',  encarregadoId: 'enc1', inscritoEm: '2026-02-10T10:00:00' },
      { alunoId: 'aluno2', alunoNome: 'Sofia Oliveira',   encarregadoId: 'enc1', inscritoEm: '2026-02-10T10:05:00' },
      { alunoId: 'aluno3', alunoNome: 'Lucas Rodrigues',  encarregadoId: 'enc2', inscritoEm: '2026-02-11T09:00:00' },
      { alunoId: 'aluno4', alunoNome: 'Beatriz Ferreira', encarregadoId: 'enc3', inscritoEm: '2026-02-12T15:00:00' },
      { alunoId: 'aluno5', alunoNome: 'Tomás Ferreira',   encarregadoId: 'enc3', inscritoEm: '2026-02-12T15:05:00' }
    ],
    criadaEm: '2026-02-05T11:00:00'
  },
  {
    id: 'turma5',
    nome: 'Ballet Clássico — Intermédio',
    modalidade: 'Ballet',
    descricao: 'Aperfeiçoamento técnico do Ballet Clássico. Barra, centro, saltos e pirouettes. Preparação para avaliações técnicas nacionais.',
    nivel: 'Intermédio',
    faixaEtaria: '9-14 anos',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    diasSemana: [1, 3, 5],
    horaInicio: '16:00',
    horaFim: '17:30',
    duracao: 90,
    lotacaoMaxima: 8,
    preco: 60,
    dataInicio: '2026-03-02',
    status: 'ABERTA',
    cor: '#f472b6',
    requisitos: 'Mínimo 1 ano de Ballet. Sapatilhas de meia-ponta obrigatórias.',
    alunosInscritos: [],
    criadaEm: '2026-02-28T16:00:00'
  }
];

// Figurinos da escola e particulares
export const mockFigurinos: Figurino[] = [
  {
    id: 'fig1',
    nome: 'Tutu Clássico Branco',
    descricao: 'Tutu profissional para ballet clássico',
    tamanho: 'M',
    imagem: 'https://images.unsplash.com/photo-1602135057246-0cc39232226e?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário A - Prateleira 2'
  },
  {
    id: 'fig2',
    nome: 'Figurino Jazz Moderno',
    descricao: 'Conjunto completo para apresentações de jazz',
    tamanho: 'G',
    imagem: 'https://images.unsplash.com/photo-1741789632384-450dd6c7a060?w=400',
    status: 'ALUGADO',
    tipo: 'ESCOLA',
    alugadoPor: 'Sofia Oliveira',
    alugadoEm: '2026-03-01',
    alugadoAte: '2026-03-20',
    localArmazenamento: 'Armário B - Prateleira 1'
  },
  {
    id: 'fig3',
    nome: 'Roupa Contemporâneo Preta',
    descricao: 'Peça única para dança contemporânea',
    tamanho: 'P',
    imagem: 'https://images.unsplash.com/photo-1758398332707-5503398ff5c4?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário C - Prateleira 3'
  },
  {
    id: 'fig4',
    nome: 'Vestido Flamenco Vermelho',
    descricao: 'Vestido tradicional de flamenco com babados',
    tamanho: 'M',
    imagem: 'https://images.unsplash.com/photo-1766748442485-db5b1e8e3850?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário A - Prateleira 1'
  },
  {
    id: 'fig5',
    nome: 'Collant Preto Profissional',
    descricao: 'Collant de alta qualidade para ballet',
    tamanho: 'M',
    imagem: 'https://images.unsplash.com/photo-1630512874316-88dcd1925237?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário D - Gaveta 1'
  },
  {
    id: 'fig6',
    nome: 'Sapatilhas de Ponta Rosa',
    descricao: 'Sapatilhas de ponta profissionais',
    tamanho: 'P',
    imagem: 'https://images.unsplash.com/photo-1592554536753-6d811a6ff52f?w=400',
    status: 'ALUGADO',
    tipo: 'ESCOLA',
    alugadoPor: 'Beatriz Ferreira',
    alugadoEm: '2026-02-15',
    alugadoAte: '2026-04-15',
    localArmazenamento: 'Armário D - Gaveta 2'
  },
  {
    id: 'fig7',
    nome: 'Figurino Hip-Hop Street',
    descricao: 'Conjunto completo estilo urbano para hip-hop',
    tamanho: 'G',
    imagem: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário B - Prateleira 3'
  },
  {
    id: 'fig8',
    nome: 'Tutu Azul Celeste',
    descricao: 'Tutu para ballet com detalhes prateados',
    tamanho: 'P',
    imagem: 'https://images.unsplash.com/photo-1602135057246-0cc39232226e?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário A - Prateleira 3'
  },
  {
    id: 'fig9',
    nome: 'Conjunto Sapateado Completo',
    descricao: 'Roupa e sapatos profissionais para sapateado',
    tamanho: 'M',
    imagem: 'https://images.unsplash.com/photo-1748842806398-f9df692ef9f9?w=400',
    status: 'DISPONIVEL',
    tipo: 'ESCOLA',
    localArmazenamento: 'Armário C - Prateleira 1'
  },
  {
    id: 'fig10',
    nome: 'Vestido Vals Dourado',
    descricao: 'Vestido elegante para danças de salão',
    tamanho: 'M',
    imagem: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    status: 'VENDIDO',
    tipo: 'ESCOLA',
    localArmazenamento: 'N/A - Vendido'
  }
];

// Anúncios no marketplace
export const mockAnuncios: AnuncioMarketplace[] = [
  {
    id: 'anun1',
    titulo: 'Sapatilhas de Ballet Rosa - Tamanho 38',
    descricao: 'Sapatilhas em excelente estado, usadas apenas 3 vezes. Marca Bloch.',
    preco: 25,
    imagem: 'https://images.unsplash.com/photo-1592554536753-6d811a6ff52f?w=400',
    vendedorId: 'enc1',
    vendedorNome: 'Pedro Oliveira',
    vendedorContato: '912345678',
    vendedorEmail: 'pedro.oliveira@email.pt',
    status: 'APROVADO',
    tipoTransacao: 'VENDA',
    criadoEm: '2026-02-28T10:00:00'
  },
  {
    id: 'anun2',
    titulo: 'Collants Pretos - Vários Tamanhos',
    descricao: 'Lote de 3 collants pretos, tamanhos P, M e G. Novos.',
    preco: 15,
    imagem: 'https://images.unsplash.com/photo-1630512874316-88dcd1925237?w=400',
    vendedorId: 'enc2',
    vendedorNome: 'Sofia Rodrigues',
    vendedorContato: '913456789',
    vendedorEmail: 'sofia.rodrigues@email.pt',
    status: 'PENDENTE',
    tipoTransacao: 'VENDA',
    criadoEm: '2026-03-01T14:30:00'
  },
  {
    id: 'anun3',
    titulo: 'Sapatos de Sapateado - Tamanho 40',
    descricao: 'Sapatos de sapateado profissionais, marca Capezio.',
    preco: 45,
    imagem: 'https://images.unsplash.com/photo-1748842806398-f9df692ef9f9?w=400',
    vendedorId: 'enc1',
    vendedorNome: 'Pedro Oliveira',
    vendedorContato: '912345678',
    vendedorEmail: 'pedro.oliveira@email.pt',
    status: 'APROVADO',
    tipoTransacao: 'VENDA',
    criadoEm: '2026-02-25T16:00:00'
  },
  {
    id: 'anun4',
    titulo: 'Tutu Clássico Profissional',
    descricao: 'Tutu profissional disponível para aluguer. Perfeito para apresentações de ballet clássico.',
    preco: 20,
    imagem: 'https://images.unsplash.com/photo-1602135057246-0cc39232226e?w=400',
    vendedorId: 'dir1',
    vendedorNome: 'ENT\'ARTES',
    vendedorContato: '211234567',
    vendedorEmail: 'figurinos@entartes.pt',
    status: 'APROVADO',
    tipoTransacao: 'ALUGUER',
    criadoEm: '2026-02-20T09:00:00',
    espetaculoNome: 'Espetáculo de Fim de Ano',
    stockAssociadoId: 'fig1'
  },
  {
    id: 'anun5',
    titulo: 'Figurino Jazz Moderno',
    descricao: 'Conjunto completo para apresentações de jazz. Disponível para aluguer.',
    preco: 15,
    imagem: 'https://images.unsplash.com/photo-1741789632384-450dd6c7a060?w=400',
    vendedorId: 'dir1',
    vendedorNome: 'ENT\'ARTES',
    vendedorContato: '211234567',
    vendedorEmail: 'figurinos@entartes.pt',
    status: 'APROVADO',
    tipoTransacao: 'ALUGUER',
    criadoEm: '2026-02-22T11:00:00',
    stockAssociadoId: 'fig2'
  }
];

// Reservas de figurino
export const mockReservasFigurino: ReservaFigurino[] = [
  {
    id: 'res1',
    anuncioId: 'anun4',
    anuncioTitulo: 'Tutu Clássico Profissional',
    usuarioId: 'aluno1',
    usuarioNome: 'Miguel Oliveira',
    dataInicio: '2026-06-15',
    dataFim: '2026-06-22',
    status: 'PENDENTE',
    criadoEm: '2026-03-10T14:00:00'
  },
  {
    id: 'res2',
    anuncioId: 'anun5',
    anuncioTitulo: 'Figurino Jazz Moderno',
    usuarioId: 'aluno2',
    usuarioNome: 'Sofia Oliveira',
    dataInicio: '2026-04-01',
    dataFim: '2026-04-05',
    status: 'APROVADA',
    criadoEm: '2026-03-05T10:00:00'
  }
];

// Eventos públicos
export const mockEventos: Evento[] = [
  {
    id: 'evt1',
    titulo: 'Espetáculo de Fim de Ano',
    descricao: 'Grande espetáculo anual com apresentações de todos os grupos da ENT\'ARTES. Uma noite mágica de dança e emoção.',
    data: '2026-06-20',
    local: 'Teatro Municipal',
    imagem: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800',
    linkBilhetes: 'https://www.ticketline.pt',
    destaque: true
  },
  {
    id: 'evt2',
    titulo: 'Workshop de Hip-Hop',
    descricao: 'Workshop intensivo com coreógrafo internacional. Inscrições limitadas.',
    data: '2026-03-15',
    local: 'ENT\'ARTES - Estúdio Principal',
    imagem: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800',
    linkBilhetes: 'https://www.ticketline.pt',
    destaque: true
  },
  {
    id: 'evt3',
    titulo: 'Gala de Ballet Clássico',
    descricao: 'Apresentação especial de ballet clássico com excertos das grandes obras.',
    data: '2026-04-10',
    local: 'Centro Cultural',
    imagem: 'https://images.unsplash.com/photo-1518611507436-f9221403cca2?w=800',
    linkBilhetes: 'https://www.ticketline.pt',
    destaque: false
  },
  {
    id: 'evt4',
    titulo: 'Mostra de Dança Contemporânea',
    descricao: 'Mostra de trabalhos criativos dos alunos avançados.',
    data: '2026-05-05',
    local: 'ENT\'ARTES - Todos os Estúdios',
    imagem: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800',
    destaque: false
  }
];

// Disponibilidades dos professores (slots semanais recorrentes)
export const mockDisponibilidades: SlotDisponibilidade[] = [
  // --- João Santos (prof1) ---
  {
    id: 'disp1',
    professorId: 'prof1',
    professorNome: 'João Santos',
    diaSemana: 1, // Segunda-feira
    horaInicio: '14:00',
    horaFim: '15:00',
    duracao: 60,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Hip-Hop'
  },
  {
    id: 'disp2',
    professorId: 'prof1',
    professorNome: 'João Santos',
    diaSemana: 1, // Segunda-feira
    horaInicio: '15:30',
    horaFim: '17:00',
    duracao: 90,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Dança Urbana'
  },
  {
    id: 'disp3',
    professorId: 'prof1',
    professorNome: 'João Santos',
    diaSemana: 3, // Quarta-feira
    horaInicio: '10:00',
    horaFim: '11:00',
    duracao: 60,
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Hip-Hop'
  },
  {
    id: 'disp4',
    professorId: 'prof1',
    professorNome: 'João Santos',
    diaSemana: 5, // Sexta-feira
    horaInicio: '16:00',
    horaFim: '17:30',
    duracao: 90,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Dança Urbana'
  },

  // --- Ana Costa (prof2) ---
  {
    id: 'disp5',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    diaSemana: 2, // Terça-feira
    horaInicio: '16:00',
    horaFim: '17:30',
    duracao: 90,
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Ballet Clássico'
  },
  {
    id: 'disp6',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    diaSemana: 4, // Quinta-feira
    horaInicio: '18:00',
    horaFim: '19:00',
    duracao: 60,
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    modalidade: 'Ballet Contemporâneo'
  },
  {
    id: 'disp7',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    diaSemana: 6, // Sábado
    horaInicio: '10:00',
    horaFim: '11:30',
    duracao: 90,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Ballet Clássico'
  },
  {
    id: 'disp8',
    professorId: 'prof2',
    professorNome: 'Ana Costa',
    diaSemana: 6, // Sábado
    horaInicio: '12:00',
    horaFim: '13:00',
    duracao: 60,
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Dança Clássica'
  },

  // --- Carlos Mendes (prof3) ---
  {
    id: 'disp9',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    diaSemana: 3, // Quarta-feira
    horaInicio: '15:00',
    horaFim: '16:00',
    duracao: 60,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Dança Contemporânea'
  },
  {
    id: 'disp10',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    diaSemana: 4, // Quinta-feira
    horaInicio: '15:00',
    horaFim: '16:00',
    duracao: 60,
    estudioId: 'est3',
    estudioNome: 'Sala de Ensaio',
    modalidade: 'Teatro Dança'
  },
  {
    id: 'disp11',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    diaSemana: 5, // Sexta-feira
    horaInicio: '17:00',
    horaFim: '18:30',
    duracao: 90,
    estudioId: 'est2',
    estudioNome: 'Estúdio Pequeno',
    modalidade: 'Dança Contemporânea'
  },
  {
    id: 'disp12',
    professorId: 'prof3',
    professorNome: 'Carlos Mendes',
    diaSemana: 6, // Sábado
    horaInicio: '14:00',
    horaFim: '15:30',
    duracao: 90,
    estudioId: 'est1',
    estudioNome: 'Estúdio Principal',
    modalidade: 'Teatro Dança'
  }
];