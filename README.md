# Sistema de Gestão de Aulas, Figurinos e Eventos

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs)
![Fastify](https://img.shields.io/badge/Framework-Fastify-000000?logo=fastify)
![REST API](https://img.shields.io/badge/API-REST-red?logo=json)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)
![Status](https://img.shields.io/badge/Status-Academic_Project-fe7d37)

## 1. Introdução

O presente projeto tem como objetivo o desenvolvimento de uma aplicação web para a gestão de aulas de coaching, gestão de figurinos e divulgação de eventos, permitindo a interação entre diferentes tipos de utilizadores, nomeadamente alunos, encarregados de educação, professores e direção.

A aplicação visa responder às necessidades identificadas no contexto da organização, promovendo a digitalização dos processos de marcação de aulas, gestão de recursos e comunicação de eventos.

---

## 2. Objetivos do Sistema

- Permitir autenticação segura de utilizadores
- Gerir pedidos e agendamento de aulas
- Controlar disponibilidade de professores e salas
- Gerir inventário e reservas de figurinos
- Disponibilizar e divulgar eventos
- Garantir comunicação eficiente entre os intervenientes

---

## 3. Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|----------|
| Frontend | React |
| Backend | Node.js + Fastify |
| API | REST |
| Base de Dados | PostgreSQL + Prisma |
| Autenticação | JWT + bcrypt |
| Documentação | Swagger, JSDoc, Markdown |
| Testes | Vitest, React Testing Library |
| API Testing | Postman |

---

## 4. Arquitetura do Sistema

O sistema segue uma arquitetura modular baseada em três camadas principais:

- Frontend: Interface com o utilizador
- Backend: Lógica de negócio
- Base de Dados: Persistência de dados

A comunicação entre frontend e backend é realizada através de uma API REST.

---

## 5. Estrutura do Projeto

```
project-root/
├── frontend/
├── backend/
├── docs/
├── postman/
└── scripts/
```

---

## 6. Instalação e Execução

### 6.1 Pré-requisitos

- Node.js
- PostgreSQL
- npm

### 6.2 Configuração

```
git clone <url-do-repositório>
cd project-root
```

Criar ficheiro `.env` na pasta backend:

```
DATABASE_URL=postgresql://user:password@localhost:5432/entartes
JWT_SECRET=chave_secreta
```

### 6.3 Instalação

Backend:
```
cd backend
npm install
```

Frontend:
```
cd frontend
npm install
```

### 6.4 Execução

Backend:
```
node src/server.js
```

Frontend:
```
npm run dev
```

---

## 7. Segurança

- Hash de passwords com bcrypt
- Autenticação com JWT
- Proteção de rotas

---

## 8. Documentação

- Swagger: API
- JSDoc: Código
- Markdown: Documentação técnica

---

## 9. Testes

- Backend: Vitest + Supertest
- Frontend: React Testing Library

---

## 10. Conclusão

O projeto permitiu aplicar conceitos de engenharia de software, arquitetura e desenvolvimento fullstack.

---

## 11. Autores

- André Filipe da Cunha Rodrigues
- Eduardo Jorge dos Santos Lage
- Francisco Duarte Araújo da Rocha
- Rui Pedro Rodrigues Gonçalves
- Vítor João Gomes da Silva
  
---

## 12. Contexto Académico

Projeto desenvolvido em contexto académico com foco em modelação, arquitetura e desenvolvimento web.
