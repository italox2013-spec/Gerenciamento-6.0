# Gerenciamento Financeiro 6.0

Sistema completo de gerenciamento financeiro pessoal e empresarial com funcionalidades de relatórios estatísticos.

## 📋 Funcionalidades

### 👤 Módulo Pessoal
- **Dashboard**: Visualização geral de receitas, despesas, saldo, metas e investimentos
- **Finanças**: Controle de receitas e despesas com categorização
- **Metas**: Gerenciamento de metas financeiras com acompanhamento de progresso
- **Investimentos**: Registro e acompanhamento de investimentos com cálculo de retorno
- **Relatórios**: Estatísticas com média e desvio padrão de receitas, despesas e investimentos

### 🏢 Módulo Empreendedor
- **Dashboard**: Visão geral de vendas, estoque e alertas
- **Vendas**: Registro e acompanhamento de vendas
- **Estoque**: Gerenciamento de produtos com controle de quantidade e preços
- **Cadastro**: Sistema de inventário completo
- **Relatórios**: Métricas estatísticas de vendas e estoque

### 👨‍💼 Módulo Administrador
- **Usuários**: Criação e gerenciamento de usuários do sistema
- **Redefinição de Senha**: Capacidade de resetar senhas de usuários
- **Backups**: Sistema de gerenciamento de backups do banco de dados
- **Relatórios Completo**: Visão consolidada de todos os dados do sistema

## 🚀 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: SQLite3
- **Autenticação**: JWT (JSON Web Tokens)
- **Segurança**: bcryptjs para hash de senhas
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/italox2013-spec/Gerenciamento-6.0.git
cd Gerenciamento-6.0
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Acesse o sistema em: `http://localhost:3000`

## 🔐 Credenciais Padrão

- **Usuário**: admin
- **Senha**: admin123
- **Perfil**: Administrador

## 📊 Relatórios e Métricas

O sistema gera relatórios estatísticos com as seguintes métricas:

- **Média**: Valor médio dos dados
- **Desvio Padrão**: Medida de dispersão dos dados
- **Mínimo e Máximo**: Valores extremos
- **Total**: Soma de todos os valores
- **Contagem**: Quantidade de registros

## 🏗️ Estrutura do Projeto

```
Gerenciamento-6.0/
├── server.js           # Servidor Express e API endpoints
├── database.js         # Configuração do banco de dados
├── package.json        # Dependências do projeto
├── public/             # Arquivos frontend
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos da aplicação
│   ├── app.js          # Lógica principal do frontend
│   ├── dashboards.js   # Módulos pessoais
│   └── business.js     # Módulos empreendedor e admin
└── README.md           # Documentação
```

## 🔒 Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Autorização baseada em roles (perfis)
- Validação de entrada de dados

## 🛠️ API Endpoints

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Dados do usuário atual

### Pessoal
- `GET /api/pessoal/dashboard` - Dashboard pessoal
- `GET/POST/DELETE /api/pessoal/finances` - Finanças
- `GET/POST/PUT/DELETE /api/pessoal/goals` - Metas
- `GET/POST/PUT/DELETE /api/pessoal/investments` - Investimentos

### Empreendedor
- `GET /api/empreendedor/dashboard` - Dashboard empreendedor
- `GET/POST/DELETE /api/empreendedor/sales` - Vendas
- `GET/POST/PUT/DELETE /api/empreendedor/inventory` - Estoque

### Administrador
- `GET/POST /api/admin/users` - Gerenciamento de usuários
- `PUT /api/admin/users/:id/password` - Redefinição de senha
- `GET/POST /api/admin/backups` - Gerenciamento de backups

### Relatórios
- `GET /api/relatorios/pessoal` - Relatório pessoal
- `GET /api/relatorios/empreendedor` - Relatório empreendedor
- `GET /api/relatorios/completo` - Relatório completo (admin)

## 👥 Perfis de Usuário

1. **Pessoal**: Acesso a funcionalidades de gestão financeira pessoal
2. **Empreendedor**: Acesso a funcionalidades de gestão empresarial
3. **Administrador**: Acesso total ao sistema, incluindo gestão de usuários

## 📝 Licença

MIT

## 👨‍💻 Desenvolvimento

Para desenvolvimento com hot-reload:
```bash
npm run dev
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.