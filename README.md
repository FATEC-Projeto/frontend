# 🚀 Projeto frontend - Guia de Commits e Colaboração

## 📋 Índice
- [Convenção de Commits](#-convenção-de-commits)
- [Estrutura das Mensagens](#-estrutura-das-mensagens)
- [Tipos de Commit](#-tipos-de-commit)
- [Exemplos Práticos](#-exemplos-práticos)
- [Workflow do Git](#-workflow-do-git)
- [Branches](#-estratégia-de-branches)
- [Pull Requests](#-pull-requests)
- [Comandos Úteis](#-comandos-úteis)
- [Ferramentas Recomendadas](#-ferramentas-recomendadas)

---

## 🎯 Convenção de Commits

Seguimos o padrão **Conventional Commits** para manter o histórico organizado e facilitar a geração automática de changelogs.

### Formato Padrão:
```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Regras Importantes:
- ✅ Use **presente do indicativo** ("adiciona" não "adicionado")
- ✅ Primeira letra **minúscula** na descrição
- ✅ **Sem ponto final** na descrição
- ✅ Máximo **50 caracteres** no título
- ✅ Linha em branco entre título e corpo
- ✅ Corpo com máximo **72 caracteres** por linha

---

## 📝 Estrutura das Mensagens

### Título (Obrigatório)
```
feat(auth): #tarefa adiciona sistema de login JWT
```

### Com Corpo (Opcional)
```
feat(auth): adiciona sistema de login JWT

Implementa autenticação usando JSON Web Tokens com:
- Middleware de validação
- Refresh token automático
- Logout seguro
```

### Com Breaking Change
```
feat(api)!: #tarefa altera estrutura de resposta da API

BREAKING CHANGE: campo 'data' agora é obrigatório em todas as respostas
```

---

## 🏷️ Tipos de Commit

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(upload): adiciona drag and drop` |
| `fix` | Correção de bug | `fix(auth): corrige validação de token` |
| `docs` | Documentação | `docs(readme): atualiza guia de instalação` |
| `style` | Formatação, espaços | `style(css): ajusta indentação` |
| `refactor` | Refatoração de código | `refactor(api): simplifica validação` |
| `test` | Testes | `test(auth): adiciona testes unitários` |
| `chore` | Tarefas de build, deps | `chore(deps): atualiza react para v18` |
| `perf` | Melhoria de performance | `perf(db): otimiza query de projetos` |
| `ci` | Integração contínua | `ci(github): adiciona workflow de testes` |
| `build` | Sistema de build | `build(webpack): configura hot reload` |
| `revert` | Reverter commit | `revert: desfaz commit abc123` |

---

## 💡 Exemplos Práticos

### ✅ Commits Bons
```bash
# Funcionalidade nova
feat(dashboard): #tarefa adiciona gráfico de produtividade

# Correção específica
fix(upload): #tarefa resolve erro de timeout em arquivos grandes

# Documentação
docs(api): #tarefa documenta endpoints de aprovação

# Refatoração
refactor(components): #tarefa  extrai lógica de validação

# Teste
test(upload): #tarefa  adiciona testes de integração

# Configuração
chore(eslint): #tarefa adiciona regras de TypeScript
```

### ❌ Commits Ruins
```bash
# Muito vago
fix: corrige bug

# Muito longo
feat: adiciona sistema completo de upload de arquivos com validação, preview, progress bar e notificações

# Tempo verbal errado
feat: adicionado login

# Sem contexto
update files

# Mistura múltiplas mudanças
feat: adiciona login e corrige bug do upload
```

---

## 🌊 Workflow do Git

### 1. Antes de Começar
```bash
# Sempre puxe as últimas mudanças
git pull origin main

# Crie uma branch para sua feature
git checkout -b feat/nome-da-feature
```

### 2. Durante o Desenvolvimento
```bash
# Adicione arquivos específicos
git add src/components/Login.tsx

# Ou adicione tudo (cuidado!)
git add .

# Commit com mensagem clara
git commit -m "feat(auth): adiciona componente de login"
```

### 3. Antes de Enviar
```bash
# Verifique o que será commitado
git status
git diff --staged

# Push da branch
git push origin feat/nome-da-feature
```

---

## 🌳 Estratégia de Branches

### Branches Principais
- `main` - Código de produção (sempre estável)
- `develop` - Integração de features (para desenvolvimento)

### Branches de Feature
```bash
# Nomenclatura
feat/nome-da-funcionalidade
fix/nome-do-bug
docs/nome-da-documentacao
refactor/nome-da-refatoracao

# Exemplos
feat/upload-artes
feat/dashboard-designer
fix/login-validation
docs/api-documentation
```

### Fluxo de Trabalho
```bash
# 1. Criar branch a partir da main
git checkout main
git pull origin main
git checkout -b feat/nova-funcionalidade

# 2. Desenvolver e commitar
git add .
git commit -m "feat(upload): adiciona validação de arquivos"

# 3. Push e Pull Request
git push origin feat/nova-funcionalidade
# Criar PR no GitHub
```

---

## 🔄 Pull Requests

### Template de PR
```markdown
## 📝 Descrição
Breve descrição das mudanças implementadas.

## 🎯 Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Sem conflitos com main

## 📸 Screenshots (se aplicável)
[Adicionar prints das mudanças visuais]

## 🧪 Como Testar
1. Faça checkout da branch
2. Execute `npm install`
3. Execute `npm run dev`
4. Teste a funcionalidade X
```

### Boas Práticas de PR
- ✅ **Título claro** e descritivo
- ✅ **Descrição detalhada** das mudanças
- ✅ **Screenshots** para mudanças visuais
- ✅ **Testes** incluídos quando necessário
- ✅ **Revisão** de pelo menos 1 colega
- ✅ **Conflitos resolvidos** antes do merge

---

## 🛠️ Comandos Úteis

### Verificação e Status
```bash
# Ver status dos arquivos
git status

# Ver diferenças
git diff
git diff --staged

# Ver histórico
git log --oneline
git log --graph --oneline --all
```

### Correções Rápidas
```bash
# Alterar última mensagem de commit
git commit --amend -m "nova mensagem"

# Adicionar arquivos ao último commit
git add arquivo.txt
git commit --amend --no-edit

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer mudanças não commitadas
git checkout -- arquivo.txt
git reset --hard HEAD
```

### Sincronização
```bash
# Atualizar branch local com remota
git pull origin main

# Rebase interativo (limpar histórico)
git rebase -i HEAD~3

# Sincronizar fork (se aplicável)
git remote add upstream URL_ORIGINAL
git fetch upstream
git merge upstream/main
```

---

## 🔧 Ferramentas Recomendadas

### Extensions do VS Code
- **GitLens** - Histórico e blame inline
- **Git Graph** - Visualização gráfica do histórico
- **Conventional Commits** - Autocomplete para commits

### Configuração do Git
```bash
# Configurar nome e email
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# Configurar editor padrão
git config --global core.editor "code --wait"

# Configurar merge tool
git config --global merge.tool vscode
```

### Aliases Úteis
```bash
# Adicionar ao ~/.gitconfig
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit -a
    ps = push
    pl = pull
    lg = log --oneline --graph --all
    unstage = reset HEAD --
```

---

## 📚 Recursos Adicionais

### Links Úteis
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)

### Comandos de Emergência
```bash
# Recuperar commit deletado
git reflog
git checkout <hash-do-commit>

# Limpar mudanças locais
git clean -fd
git reset --hard HEAD

# Voltar arquivo específico
git checkout HEAD -- arquivo.txt
```

---

## 🤝 Colaboração em Equipe

### Comunicação
- 💬 **Comente** nos PRs de forma construtiva
- 🔍 **Revise** o código dos colegas
- 📢 **Comunique** mudanças importantes no grupo
- ❓ **Tire dúvidas** antes de fazer mudanças grandes

### Responsabilidades
- 👤 **Cada um** é responsável por sua branch
- 🔄 **Todos** devem revisar PRs
- 📝 **Mantenha** commits organizados
- 🧪 **Teste** antes de fazer push

### Resolução de Conflitos
```bash
# Quando houver conflito no merge
git status  # Ver arquivos em conflito
# Editar arquivos manualmente
git add arquivo-resolvido.txt
git commit -m "resolve: conflito em arquivo-resolvido"
```

---

## 🎯 Resumo das Regras de Ouro

1. **Commits pequenos e frequentes** são melhores que commits grandes
2. **Uma mudança = um commit** (não misture funcionalidades)
3. **Teste antes de commitar** (evite quebrar o código dos colegas)
4. **Mensagens claras** ajudam todos a entender o histórico
5. **Pull antes de push** para evitar conflitos
6. **Use branches** para cada feature/correção
7. **Revise PRs** dos colegas com atenção
8. **Comunique mudanças** importantes para a equipe

---

**Lembre-se**: Um bom histórico de commits é como uma documentação viva do projeto! 📖✨

---

*Criado para o Projeto Workflow - FATEC Cotia*

