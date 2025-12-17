# Guia de Uso - Sistema de Gerenciamento Financeiro 6.0

## Iniciando o Sistema

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

3. Acesse o sistema em: http://localhost:3000

## Perfis de Usuário

### 1. Administrador
**Credenciais Padrão:** admin / admin123

**Funcionalidades:**
- Criar novos usuários (pessoal, empreendedor ou administrador)
- Redefinir senhas de qualquer usuário
- Criar backups do sistema
- Visualizar relatórios completos de todo o sistema
- Acessar estatísticas consolidadas

**Como usar:**
1. Faça login com as credenciais de administrador
2. Na aba "Usuários", clique em "Criar Usuário"
3. Preencha os dados e escolha o perfil
4. Na aba "Backups", clique em "Criar Backup" para salvar uma cópia do banco de dados
5. Na aba "Relatórios Completo", visualize estatísticas de todo o sistema

### 2. Perfil Pessoal
**Exemplo:** joao / senha123

**Funcionalidades:**
- **Dashboard**: Visualize seu saldo, receitas, despesas, metas e investimentos
- **Finanças**: Registre receitas e despesas categorizadas
- **Metas**: Crie e acompanhe metas financeiras
- **Investimentos**: Registre investimentos e acompanhe retornos
- **Relatórios**: Gere relatórios estatísticos com média e desvio padrão

**Fluxo de trabalho:**

1. **Adicionar Transação Financeira:**
   - Vá para a aba "Finanças"
   - Clique em "Adicionar Transação"
   - Escolha o tipo (Receita ou Despesa)
   - Preencha categoria, valor, descrição e data
   - Clique em "Salvar"

2. **Criar Meta Financeira:**
   - Vá para a aba "Metas"
   - Clique em "Adicionar Meta"
   - Defina título, valor alvo, valor atual e prazo
   - Acompanhe o progresso em porcentagem
   - Atualize o valor atual conforme progride

3. **Registrar Investimento:**
   - Vá para a aba "Investimentos"
   - Clique em "Adicionar Investimento"
   - Preencha nome, tipo, valor investido e valor atual
   - Veja o retorno calculado automaticamente em %

4. **Visualizar Relatórios:**
   - Acesse a aba "Relatórios"
   - Veja estatísticas de receitas e despesas:
     - Média
     - Desvio Padrão
     - Mínimo e Máximo
     - Total e Contagem
   - Analise retornos de investimentos

### 3. Perfil Empreendedor
**Exemplo:** maria / senha123

**Funcionalidades:**
- **Dashboard**: Visualize vendas totais, número de vendas, valor do estoque e alertas
- **Vendas**: Registre e acompanhe todas as vendas
- **Estoque**: Gerencie produtos, quantidades, custos e preços
- **Relatórios**: Estatísticas de vendas e estoque

**Fluxo de trabalho:**

1. **Adicionar Produto ao Estoque:**
   - Vá para a aba "Estoque"
   - Clique em "Adicionar Produto"
   - Preencha nome, categoria, quantidade, custo unitário e preço de venda
   - O sistema calcula automaticamente o valor total
   - Produtos com quantidade < 10 recebem alerta ⚠️

2. **Registrar Venda:**
   - Vá para a aba "Vendas"
   - Clique em "Registrar Venda"
   - Informe produto, quantidade, preço e cliente (opcional)
   - O valor total é calculado automaticamente

3. **Atualizar Estoque:**
   - Na aba "Estoque", clique no botão ✏️ de um produto
   - Ajuste quantidade, custo ou preço de venda
   - Salve as alterações

4. **Visualizar Relatórios:**
   - Acesse a aba "Relatórios"
   - Veja estatísticas de vendas:
     - Receita média por venda
     - Desvio padrão das vendas
     - Total de vendas
   - Analise estatísticas do estoque:
     - Valor médio por produto
     - Valor total em estoque
     - Quantidade de itens

## Métricas Estatísticas

O sistema calcula automaticamente:

- **Média (Average)**: Soma dos valores dividida pela quantidade
- **Desvio Padrão (Standard Deviation)**: Medida de dispersão dos dados (usa desvio padrão amostral n-1)
- **Mínimo/Máximo**: Valores extremos dos dados
- **Total**: Soma de todos os valores
- **Contagem**: Número de registros

## Dicas de Uso

1. **Categorização**: Use categorias consistentes para facilitar análises futuras
2. **Datas**: Mantenha as datas atualizadas para relatórios precisos
3. **Metas**: Atualize regularmente o progresso das metas
4. **Investimentos**: Atualize o valor atual periodicamente para acompanhar retornos
5. **Estoque**: Mantenha o estoque atualizado após cada venda
6. **Backups**: Faça backups regulares (recomendado: semanalmente)

## Atalhos e Recursos

- **Dashboard**: Sempre mostra um resumo atualizado dos seus dados
- **Alertas**: O sistema mostra alertas de sucesso/erro após cada ação
- **Modais**: Use modais para adicionar/editar dados rapidamente
- **Tabelas**: Todas as tabelas mostram dados em ordem cronológica
- **Cores**: 
  - Verde = Receitas/Lucros
  - Vermelho = Despesas
  - Amarelo = Alertas de estoque baixo

## Solução de Problemas

**Erro de login:**
- Verifique usuário e senha
- Certifique-se de que o servidor está rodando

**Dados não aparecem:**
- Atualize a página
- Verifique se está logado com o usuário correto
- Confirme que os dados foram salvos com sucesso

**Erro ao criar backup:**
- Verifique permissões de escrita na pasta do projeto
- Certifique-se de que há espaço em disco

## API REST

O sistema também oferece uma API REST completa. Consulte o README.md para a lista de endpoints disponíveis.

## Suporte

Para problemas ou sugestões, abra uma issue no repositório do GitHub.
