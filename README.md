# Taggy Frontend - Mobilidade Inteligente & Sustentável

Um frontend completo para a plataforma Taggy, focado em autenticação, gestão de frota, cálculo de viagens, auto-recarga, simulação de pedágios e análise de impacto ambiental em tempo real. A interface acompanha o backend principal e entrega uma experiência operacional clara para o usuário final.

## 🚀 Funcionalidades

* **🔐 Autenticação com Login e Cadastro:** fluxo completo de acesso com JWT, incluindo cadastro de conta, login, sessão persistida e redirecionamento automático para as áreas protegidas.
* **📊 Dashboard Operacional:** visão geral com saldo da tag, quantidade de veículos, total de viagens, custo acumulado e CO₂ emitido.
* **🚗 Gestor de Frotas e Veículos (CRUD):** cadastro e manutenção de veículos com parâmetros de propulsão, consumo, emissão e eficiência energética.
* **🛣️ Calculadora e Histórico de Viagens:** simulação do custo real da rota antes da partida, com pedágios, combustível, energia e emissão estimada.
* **💳 Auto-Recarga e Saldo:** configuração do limite mínimo, valor de recarga automática e recarga manual instantânea.
* **⚡ Simulador de Passagem:** emula a passagem por uma praça de pedágio e atualiza saldo, extrato e estado da auto-recarga.
* **📄 Extrato Financeiro e Ambiental:** histórico das recargas e débitos com leitura do impacto total da operação.
* **👤 Perfil do Usuário:** atualização de dados pessoais, troca de senha e exclusão da conta.

---

## 🛠️ Estrutura de Frontend e Lógica

Para manter a interface organizada e previsível, o projeto implementa:

1. **Roteamento File-Based:** o TanStack Router organiza cada tela em `src/routes/`, com proteção de acesso e redirecionamento por autenticação.
2. **Estado e Cache de API:** o TanStack Query centraliza as requisições, mantendo dashboard, veículos, viagens e extrato sincronizados.
3. **Camada de Autenticação:** o contexto em `src/lib/auth.tsx` guarda o token no `localStorage`, carrega o usuário logado e controla logout e refresh.
4. **Cliente HTTP Unificado:** `src/lib/api.ts` concentra os endpoints da API Taggy, os tipos e o tratamento de erros.

---

## 📦 Stack

* **⚛️ React 19**
* **🧭 TanStack Start**
* **🧩 TanStack Router**
* **🔄 TanStack Query**
* **⚡ Vite**
* **🎨 Tailwind CSS 4**
* **🪄 Radix UI**
* **🔔 Sonner**
* **🧶 Bun**

---

## 🗺️ Rotas da Aplicação

O frontend expõe as seguintes telas principais:

* `/auth` - login e cadastro
* `/dashboard` - visão geral da conta e da frota
* `/vehicles` - cadastro e manutenção de veículos
* `/trips` - cálculo e histórico de viagens
* `/auto-refill` - configuração de auto-recarga e saldo
* `/simulator` - simulação de passagem de pedágio
* `/statement` - extrato financeiro e impacto ambiental
* `/profile` - dados da conta e senha

---

### Run locally

```bash
bun install
bun run dev
```

By default the frontend reads the API at `http://localhost:5158` through `src/lib/api.ts`.

### Build

```bash
bun run build
```

### Preview

```bash
bun run preview
```

### Scripts

* `bun run dev` - inicia o ambiente de desenvolvimento
* `bun run build` - gera a build de produção
* `bun run build:dev` - gera a build com o modo `development`
* `bun run preview` - serve a build localmente
* `bun run lint` - executa o ESLint
* `bun run format` - formata o código com Prettier

---

## 💡 Diferencial

Diferente de dashboards genéricos, o **Taggy Frontend** foi pensado para operar o fluxo completo da jornada: do login ao saldo, da simulação à viagem registrada, e da recarga manual à auto-recarga. Tudo é apresentado com foco em clareza operacional e métricas que conectam mobilidade e sustentabilidade.

---

## 🔗 Projeto Relacionado

- Backend principal: https://github.com/rafareloM/taggy