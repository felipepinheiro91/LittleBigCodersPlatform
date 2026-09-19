# Frontend LittleBIG Coders

Interface responsiva construída com React, Vite e Chakra UI, baseada nos requisitos de estudantes e professores.

## Execução

```bash
npm install
npm run dev
```

A API Django é esperada em `http://127.0.0.1:8000/api` por padrão. Para outro endereço, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Integração atual

- Todas as telas usam a API Django, sem fallback para dados demonstrativos.
- Login via JWT, perfil em `me/`, renovação em `token/refresh/` e sessão em `sessionStorage` (sobrevive ao recarregamento da aba; sair remove os tokens).
- Livros associados → capítulos → materiais e provas. URLs de materiais abrem em nova aba; textos são exibidos sem executar HTML.
- Provas: início de tentativa, navegação entre questões, envio das respostas, resultado calculado pelo servidor, nova tentativa e histórico.
- Dashboard, conquistas e ranking consultam os resultados persistidos. O ranking global é anonimizado.
- Professor: turmas, filtros por turma/livro/capítulo/aluno, indicadores agregados, distribuição, comparativos e histórico individual.
- Sequências: criação, edição e cópia de sugestões, com todos os campos do planejamento e etapas dinâmicas persistidos no banco.
- Administrador: painel abre em Livros, com abas para capítulos, desafios, materiais e cadastros escolares. Permite criar, pesquisar, editar e remover registros.
- Para criar conteúdo: cadastre o livro (com capa opcional), adicione capítulos e abra Desafios. Escolha livro e capítulo, escreva questões e alternativas e marque uma resposta correta por questão. O material de prova é criado automaticamente, sem cadastro intermediário. Desafios com tentativas permitem alterar título, orientações e situação, preservando as questões.
- A Visão Geral do administrador apresenta indicadores globais, operação por escola, desempenho por livro e evolução mensal.
- O cadastro de livro aceita capa JPG, PNG ou WebP de até 5 MB; a imagem aparece nas listagens para administradores, professores e estudantes.
- Todas as consultas têm carregamento, erro com nova tentativa e estado vazio. Mudanças de filtros cancelam consultas antigas.

Contas sem livros ou provas cadastrados mostram estados vazios, não exemplos. O cadastro e os vínculos de livros, turmas, estudantes e materiais são gerenciados pelo backend/admin. Não há cadastro público nem botão de login demonstrativo.

## Validação manual

No painel administrativo, a aba **Sequências didáticas** permite selecionar livro e capítulo e cadastrar todos os campos do planejamento, incluindo atividades/etapas. Use **Visualizar e editar** para atualizar ou remover sugestões. Professores com acesso ao livro podem copiar as sugestões para personalizar, sem alterar o original.

1. Inicie o Django na porta 8000 e o Vite na porta 5173 (origem permitida pelo CORS).
2. Entre com uma conta cadastrada e confirme escola, livros e turmas; recarregue a aba para validar a sessão.
3. Com um professor e livro associado, abra um capítulo, crie uma sequência, salve e reabra. Copie uma sugestão antes de personalizá-la.
4. Com um aluno com acesso vigente ao mesmo livro, responda uma prova cadastrada com questões e alternativas. Confira histórico, conquistas e dashboard.
5. No professor, selecione turma, livro, capítulo e estudante em Desempenho. O histórico individual é completo; os indicadores principais respeitam o recorte.
6. Confira também uma conta sem conteúdo, credenciais inválidas e API indisponível. Sair não deve deixar dados do usuário anterior visíveis.

Use `npm run build` para validar a compilação. Contratos e regras de autorização: `../backend/API.md`. As permissões são sempre verificadas no servidor; os filtros do navegador não substituem essa proteção.
