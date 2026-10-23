# 🤝 Acolher - Sistema de Gerenciamento de Doações

> **Projeto de Extensão Universitária**  
> Curso: **Análise e Desenvolvimento de Sistemas (ADS)**  
> Aplicação: Protótipo Funcional para Instituições de Caridade e Apoio Social

---

## 📌 1. Visão Geral do Projeto

Instituições de caridade comumente enfrentam desafios operacionais ao controlar doações por meio de cadernos, planilhas dispersas ou mensagens informais. Esse cenário resulta em retrabalho, perda de itens perecíveis por validade vencida, falta de controle de saldo e dificuldades na prestação de contas aos mantenedores.

O **Acolher** foi desenvolvido como um protótipo funcional ponta a ponta para resolver essa dor, digitalizando e garantindo rastreabilidade completa em todo o ciclo da doação:
```
[Recebimento & Triagem] ➔ [Controle de Estoque em Tempo Real] ➔ [Destinação Coletiva Auditada]
```

### 👥 Perfis de Usuário Atendidos
- **Administrador (`admin`)**: Visão integral, gestão completa de estoque, registro de movimentações e permissão exclusiva para exclusão de registros e auditoria.
- **Voluntário (`voluntario`)**: Operação do dia a dia (registro de entradas de doações, saídas/destinações e atendimento de necessidades), sem permissão para exclusões acidentais de registros.

---

## 🛡️ 2. Privacidade e Conformidade com a LGPD

O sistema foi concebido desde a arquitetura de banco de dados sob o princípio da **minimização de dados** (Art. 6º, III da Lei Geral de Proteção de Dados - Lei nº 13.709/2018):
- **Beneficiários**: Nenhum dado pessoal (nome, CPF, telefone ou endereço residencial) é solicitado ou armazenado. As destinações registram exclusivamente ações coletivas ou instituições parceiras (ex.: *"Montagem de 20 Cestas Básicas - Ação Vila Esperança"*, *"Creche Municipal"*).
- **Doadores**: Registro simplificado contendo apenas o nome ou razão social (opcional), contando com o recurso rápido **"Marcar como Anônimo"**.
- **Avisos no Front-End**: Informações de uso ético e responsável expostas na tela de login, nos formulários e no rodapé do sistema.

---

## 💻 3. Tecnologias Utilizadas

- **Front-end**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (JavaScript modular).
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com design responsivo (*mobile-first*), acessível e botões com áreas de toque ampliadas.
- **Ícones**: [Lucide React](https://lucide.dev/).
- **Back-end & Banco (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security, Triggers e Views com `security_invoker`).
- **Deploy**: Pronto para deploy contínuo na [Vercel](https://vercel.com/) ou [Netlify](https://www.netlify.com/).

---

## 🗄️ 4. Configuração do Supabase (Passo a Passo)

### Passo 1: Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com/) e crie uma conta gratuita (ou faça login).
2. Clique em **"New Project"**.
3. Escolha uma organização, defina um nome (ex.: `acolher-doacoes`) e crie uma senha segura para o banco.
4. Selecione a região mais próxima (ex.: `Sao Paulo (sa-east-1)`) e clique em **"Create new project"**.

### Passo 2: Executar a Estrutura do Banco (`schema.sql`)
1. No menu lateral esquerdo do Supabase, clique em **SQL Editor** (ícone `>_`).
2. Clique em **"New Query"**.
3. Abra o arquivo local [`supabase/schema.sql`](./supabase/schema.sql), copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique no botão verde **"Run"** (ou `Ctrl + Enter`).
5. A mensagem *"Success. No rows returned"* confirmará a criação das tabelas (`profiles`, `donations`, `destinations`, `needs`), da view `vw_inventory`, dos triggers de estoque e das políticas de segurança RLS.

### Passo 3: Popular com Dados de Exemplo (`seed.sql`)
1. No **SQL Editor**, abra uma nova aba de query (**"New Query"**).
2. Abra o arquivo local [`supabase/seed.sql`](./supabase/seed.sql), copie o conteúdo e cole no editor.
3. Clique em **"Run"**.
4. Serão inseridas 16 doações variadas (alimentos com alertas de validade, roupas, higiene e brinquedos), destinações de exemplo e demandas prioritárias para a demonstração.

### Passo 4: Obter as Chaves de API
1. No menu lateral, acesse **Project Settings** (ícone de engrenagem) ➔ **API**.
2. Na seção **Project URL**, copie o valor da URL (ex.: `https://xxxxxxxx.supabase.co`).
3. Na seção **Project API keys**, copie a chave **`anon` `public`**.
> ⚠️ **Atenção:** NUNCA utilize nem compartilhe a chave `service_role`. O sistema utiliza apenas a chave pública `anon`.

---

## 👥 5. Criação dos Usuários de Teste

Para demonstrar os dois níveis de acesso na apresentação acadêmica:

### 1. Criar o Usuário Administrador
1. No painel do Supabase, acesse **Authentication** ➔ **Users**.
2. Clique em **"Add user"** ➔ **"Create user"**.
3. Preencha:
   - **Email:** `admin@acolher.org`
   - **Password:** `Admin@123456`
   - Marque a opção **"Auto Confirm User?"** para que a conta já fique pronta para login.
4. Clique em **"Create user"**.
5. Em seguida, vá em **Table Editor** ➔ selecione a tabela **`profiles`**.
6. Localize a linha correspondente ao usuário criado e altere a coluna **`role`** de `'voluntario'` para **`'admin'`**. Altere a coluna **`name`** para **`Coordenador Geral`**. Salve a linha.

### 2. Criar o Usuário Voluntário
1. Volte em **Authentication** ➔ **Users** ➔ **"Add user"**.
2. Preencha:
   - **Email:** `voluntario@acolher.org`
   - **Password:** `Voluntario@123456`
   - Marque **"Auto Confirm User?"**.
3. Clique em **"Create user"**.
4. Na tabela **`profiles`**, você pode preencher a coluna **`name`** como **`Voluntário Pedro`** (a coluna `role` já receberá `'voluntario'` por padrão).

---

## 🚀 6. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (versão 18 ou superior).

### Instalação e Execução
1. Abra o terminal na pasta raiz do projeto:
   ```bash
   cd d:\projeto-extensao\projeto-extensao
   ```
2. Crie seu arquivo de variáveis de ambiente com base no exemplo:
   - No Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
3. Abra o arquivo `.env` recém-criado e insira suas credenciais do Supabase obtidas no Passo 4:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
4. Instale as dependências (caso ainda não tenha feito):
   ```bash
   npm install
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
6. O terminal exibirá o endereço local (geralmente `http://localhost:5173`). Abra-o em seu navegador.

---

## 🌐 7. Como Fazer o Deploy

### Opção A: GitHub Pages com GitHub Actions (Configurado!)
O projeto já conta com o workflow automatizado [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) e com a base configurada em `vite.config.js`:
1. Suba este código para o seu repositório no GitHub (`https://github.com/<seu-usuario>/projeto-extensao`).
2. No seu repositório no GitHub, vá em **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Clique em **"New repository secret"** e crie os 2 segredos:
   - Nome: `VITE_SUPABASE_URL` | Valor: *(sua Project URL do Supabase)*
   - Nome: `VITE_SUPABASE_ANON_KEY` | Valor: *(sua publishable / anon key do Supabase)*
4. Em seguida, acesse **Settings** ➔ **Pages** (no menu lateral esquerdo do repositório).
5. Em **Build and deployment** ➔ **Source**, selecione **"GitHub Actions"**.
6. Pronto! A cada push na branch `main`, a action fará `npm ci`, `npm run build` e publicará o site automaticamente em:
   `https://<seu-usuario>.github.io/projeto-extensao/`

### Opção B: Vercel
1. Suba este código para o seu GitHub.
2. Acesse [vercel.com](https://vercel.com/) e importe o repositório.
3. Adicione as Environment Variables `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **"Deploy"**.

### Opção C: Netlify
1. Acesse [netlify.com](https://www.netlify.com/) e conecte com seu GitHub.
2. Build command: `npm run build` | Publish directory: `dist`.
3. Adicione as Environment variables `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Clique em **"Deploy Site"**.

---

## 📖 8. Guia Rápido de Uso para o Usuário Final

Um roteiro prático e em linguagem simples para ser apresentado à banca ou aos voluntários da instituição:

1. **Acessar o Sistema (Tela de Login)**:
   - Digite seu e-mail e senha cadastrados.
   - Observe a identificação do seu perfil no topo da tela (Administrador ou Voluntário).

2. **Visão Geral (Painel / Dashboard)**:
   - Visualize os cartões com o saldo total do estoque, doações recebidas no mês e demandas abertas.
   - **Alerta de Perecíveis:** se houver itens que vencem nos próximos 15 dias, eles aparecerão em destaque vermelho com o botão direto *"Destinar"*.

3. **Consultar o Estoque (`Estoque`)**:
   - Utilize a barra de busca para pesquisar itens pelo nome ou doador.
   - Use os filtros rápidos por Categoria (Alimentos, Roupas, Higiene, etc.) ou estado de conservação.
   - Cada cartão exibe: **Recebido**, **Destinado** e o **Saldo Atual em Estoque**.

4. **Cadastrar uma Doação Recebida (`Nova Doação`)**:
   - Preencha o nome do item, categoria, quantidade e unidade (kg, un, pacote, etc.).
   - Informe o doador ou clique no botão rápido **"Marcar como Anônimo"**.
   - Para alimentos perecíveis, informe a data de validade para alimentar os alertas preventivos.
   - Clique em **"Salvar no Estoque"**.

5. **Encaminhar Doações para Ações Sociais (`Destinar`)**:
   - No item desejado no estoque, clique no botão **"Destinar"**.
   - O sistema mostra o saldo disponível e **não permite destinar uma quantidade maior do que há no estoque**.
   - Informe a quantidade e o destino coletivo (ex.: *"Ação Sopão de Inverno"*, *"Abrigo Comunitário"*).
   - Clique em **"Confirmar Destinação"**. O estoque é recalculado imediatamente.

6. **Auditoria e Rastreabilidade (`Histórico`)**:
   - Clique em **"Histórico"** em qualquer doação para visualizar a linha do tempo completa: quando o lote entrou, por quem foi cadastrado e cada saída realizada até o saldo remanescente.

7. **Mural de Necessidades (`Necessidades`)**:
   - Registre itens com carência na instituição (ex.: *"Fórmula Infantil"*, Prioridade Alta).
   - Quando receber os itens, clique em **"Marcar como Atendida"** para dar baixa.

8. **Prestação de Contas (`Relatórios`)**:
   - Escolha o período desejado (data inicial e final).
   - Clique em **"Exportar CSV"** para baixar uma planilha pronta para abrir no Excel.
   - Clique em **"Imprimir / PDF"** para gerar um documento timbrado oficial direto do navegador.

---

## 📄 9. Licença e Créditos

Desenvolvido para fins estritamente acadêmicos como Projeto de Extensão Universitária do curso de Análise e Desenvolvimento de Sistemas (ADS). Código aberto para fins educacionais e de impacto social comunitário.
