# Ent'Artes - Sistema de Gestão de Escola de Dança

## Descrição

Sistema de gestão para escola de dança ENT'ARTES.

## Credenciais de Teste

Para testar o sistema, utilize as seguintes credenciais (password para todos: `password123`):

### Direção
- Email: `direcao@entartes.pt`
- Acesso total ao sistema

### Professor
- Email: `joao.santos@entartes.pt`
- Pode consultar e confirmar aulas

### Encarregado
- Email: `pedro.oliveira@email.pt`
- Pode solicitar aulas e usar marketplace

### Aluno
- Email: `miguel.oliveira@email.pt`
- Apenas visualiza sua agenda (leitura)

## Funcionalidades

### Área Pública
- Home page com apresentação da escola
- Página de Eventos (acesso sem login)
- Design responsivo e moderno

### Autenticação
- Login com validação
- Reset password
- Gestão de sessão

### Sistema RBAC
- 4 tipos de utilizadores: Direção, Professor, Encarregado, Aluno
- Permissões diferenciadas por role
- Aluno tem apenas leitura na agenda

### Gestão de Aulas
- Solicitação de aulas por encarregados
- Estados: PENDENTE, CONFIRMADA, REJEITADA, REALIZADA, REMARCAR
- Aprovação/rejeição pela direção
- Confirmação de realização pelo professor

### Marketplace
- Criação de anúncios por encarregados
- Moderação pela direção
- Estados: PENDENTE, APROVADO, REJEITADO

### Stock de Figurinos
- Gestão exclusiva pela direção
- Estados: DISPONIVEL, ALUGADO, MANUTENCAO, VENDIDO

## Estrutura

```
src/
├── app/
│   ├── components/    # Componentes React
│   ├── contexts/      # Contextos (Auth)
│   ├── layouts/      # Layouts
│   ├── pages/       # Páginas
│   └── types/       # TypeScript types
├── services/         # Serviços API
└── styles/          # Estilos
```
