# EasyMoney — Controle Financeiro Pessoal

## Sobre

Projeto desenvolvido como atividade da disciplina de Oficina de Desenvolvimento Web do IFPR – Campus Palmas. Trata-se de uma aplicação web de página única (SPA) para controle de finanças pessoais, que permite cadastrar receitas e despesas, acompanhar o saldo do mês e visualizar relatórios sobre a situação financeira.

O projeto é focado no frontend e, por isso, não possui servidor nem banco de dados configurados: os dados ficam salvos apenas no navegador. A integração com um backend poderá ser feita futuramente.

## Tecnologias usadas

- [Angular](https://angular.dev): framework para a construção da interface, na versão 20.
- [TypeScript](https://www.typescriptlang.org): linguagem utilizada no desenvolvimento.
- [Chart.js](https://www.chartjs.org): biblioteca para os gráficos dos relatórios.
- [Font Awesome](https://fontawesome.com): biblioteca de ícones.
- [Visual Studio Code](https://code.visualstudio.com): editor de código.

## Funcionalidades

### Página inicial

Apresenta o sistema e direciona o usuário para o acesso à conta.

<p align="center">
  <img src="screenshots/home.png" alt="Página inicial" width="700">
</p>

### Criar conta

Cadastro de novos usuários com nome, e-mail e senha, com validação dos campos e confirmação da senha.

<p align="center">
  <img src="screenshots/criarconta.png" alt="Tela de criação de conta" width="700">
</p>

### Login

Acesso ao sistema com e-mail e senha. As páginas internas só podem ser acessadas por usuários autenticados.

<p align="center">
  <img src="screenshots/login.png" alt="Tela de login" width="700">
</p>

### Dashboard

Visão geral do mês atual, com saldo, total de receitas, total de despesas e as transações mais recentes. Novas receitas e despesas podem ser lançadas diretamente desta tela, inclusive transações recorrentes, como salários, e parceladas, como compras a prazo.

<p align="center">
  <img src="screenshots/dashboard.png" alt="Dashboard" width="700">
</p>

### Relatórios

Gráficos que comparam as receitas e despesas do mês atual, projeção para o próximo mês, lançamentos previstos e histórico completo de transações com paginação, edição e exclusão.

<p align="center">
  <img src="screenshots/relatório.png" alt="Tela de relatórios" width="700">
</p>

### Configurações

Alteração do nome do usuário e da senha de acesso.

<p align="center">
  <img src="screenshots/configurações.png" alt="Tela de configurações" width="700">
</p>

### Modo de privacidade

No dashboard, nas transações e nos relatórios, um botão permite ocultar e exibir os valores monetários.

## Como executar

É necessário ter o [Git](https://git-scm.com) e o [Node.js](https://nodejs.org) (versão 20.19 ou superior) instalados.

```bash
git clone https://github.com/thiagojosecosta/controle-financeiro.git
cd controle-financeiro
npm install
npm start
```

A aplicação fica disponível em `http://localhost:4200/`.

## Créditos

Projeto desenvolvido para a disciplina de Oficina de Desenvolvimento Web, ministrada pelo professor Rafael Pagliosa.
