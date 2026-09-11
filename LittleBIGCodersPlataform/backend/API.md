# API da plataforma

Todas as rotas abaixo usam o prefixo `/api/` e autenticação `Authorization: Bearer <access>`, exceto a obtenção e renovação de token. As listas novas retornam arrays JSON. IDs são inteiros do banco, não nomes de turmas.

## Autenticação e escola

- `POST token/`: `{ "login": "...", "password": "..." }` retorna access e refresh.
- `POST token/refresh/`: `{ "refresh": "..." }`.
- `GET me/`: identidade, papel, IDs dos perfis e objeto da escola.
- `GET schools/`: escola do usuário; administradores veem todas.
- `GET classes/`: turmas do professor ou matrículas do aluno.
- `GET classes/{id}/students/`: alunos das turmas do professor.

Professor e aluno escolar precisam de escola; compras individuais podem manter aluno sem escola. Professor responsável, turma e alunos matriculados devem pertencer à mesma escola. Essas regras são validadas ao salvar os modelos e nos formulários do Admin. Operações em lote diretas no ORM não passam por `save` e precisam preservar essas invariantes.

## Livros e materiais

- `GET books/` e `GET books/{id}/`: livros associados, progresso e validade do acesso. Livros passados continuam listados com `accessible: false`.
- `GET chapters/?book={id}` e `GET chapters/{id}/`.
- `GET materials/?chapter={id}` e `GET materials/{id}/`: conteúdo, URL para vídeo/jogo incorporado, áreas e quiz_id.

Professor acessa livros associados diretamente a ele ou a suas turmas. Estudante acessa conteúdo somente com BookAccess ativo, dentro das datas e livro ativo. Gabaritos e materiais exclusivos do professor não são expostos ao aluno. URLs de mídia são cadastradas no Admin; o frontend deve validar os provedores permitidos antes de incorporar URLs em iframe.

BookAccess registra código único de etiqueta, URL do QR e período de validade. A autenticação permanece login/senha do usuário: o código da etiqueta não é uma senha alternativa. Use duração de um ano ao cadastrar acessos anuais. Nenhuma senha ou conta demonstrativa foi criada automaticamente.

## Sequências didáticas

- `GET/POST sequences/`, `GET/PATCH/PUT/DELETE sequences/{id}/`.
- `GET sequences/?chapter={id}`.
- `POST sequences/{id}/copy/`: cria cópia do professor com referência à sugestão original.

Campos: `chapter`, `title`, `axis`, `duration`, `estimated_classes`, `format`, `status` (`pending` ou `completed`), `description`, `ventures`, `rationale`, `general_objective`, `specific_objectives`, `learning_outcomes`, `contents`, `activities` (lista de `{ "title": "...", "description": "..." }`).

As sugestões têm teacher nulo e só administradores podem editá-las. Professores criam e editam suas próprias sequências nos livros disponíveis. Atividades permitem textos longos. O servidor define o proprietário; IDs de professor enviados no corpo não transferem propriedade.

## Provas

- `GET quizzes/?material={id}` e `GET quizzes/{id}/`: questões ordenadas e alternativas sem gabarito.
- `POST quizzes/{id}/start/`: cria tentativa para o aluno autenticado.
- `POST attempts/{id}/submit/`: `{ "answers": { "ID_DA_QUESTAO": ID_DA_ALTERNATIVA } }`. Enviar todas as questões após a navegação de uma questão por vez no frontend.
- `GET attempts/?student={id}&quiz={id}` e `GET attempts/{id}/`: histórico autorizado.

A correção é transacional no servidor. A resposta final contém score, total_questions, percentage, correção das escolhas e new_badges. Não aceita nota enviada pelo cliente, resposta de outra questão, submissão incompleta ou repetição da mesma tentativa. Refazer exige start novamente. Todas as tentativas concluídas contam para acertos; participação conta provas distintas concluídas. Tentativas são de leitura no Admin. Não altere questões de provas em aplicação: crie outra prova para nova versão do conteúdo.

## Conquistas, ranking e BI

- `GET achievements/?student={id}`: categorias calculadas e badges conquistados. Alunos só veem seus resultados; professores só os alunos autorizados.
- `GET rankings/?book={id}&category=accuracy`: ranking global por livro e categoria. `participation` mede conclusão; `accuracy` mede acertos; ID de área mede acertos nessa área. Participantes são identificados por pseudônimos, sem expor nomes ou escolas de outros usuários.
- `GET performance/?class={id}&chapter={id}&student={id}&book={id}`: filtros combináveis, métricas, alunos, capítulos, comparação de turmas, distribuição e pontos de atenção. Disponível para professor e administrador.
- `GET dashboard/`: indicadores da tela inicial para cada papel, incluindo pontos e pontos dos últimos sete dias para estudantes.

Média = acertos / questões respondidas em todas as tentativas concluídas. Conclusão = pares aluno/prova concluídos / provas propostas aos alunos com acesso ao livro. Sem respostas, média é null, não zero. Ativo significa possuir tentativa concluída no recorte, não acesso recente ao site. Distribuição possui faixa separada para ausência de tentativas. Atenção sinaliza conclusão abaixo de 70%, acerto abaixo de 60% ou ausência de respostas. Pontos = número de respostas corretas acumuladas. Empates no ranking são ordenados por ID.

Níveis: zero <25%, novice 25–49%, intermediate 50–74%, advanced 75–89%, expert >=90%. Badges conquistados permanecem no histórico mesmo que a média caia após outras tentativas.

## Cadastro e execução

Cadastre escolas, usuários, perfis, turmas e matrículas no Django Admin. Cadastre livros e vínculos, acessos, capítulos, materiais e provas com uma alternativa correta por questão. As áreas pedagógicas são criadas por migração. Não há dados fictícios nos relatórios da API.

```powershell
.\.venv-win\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-win\Scripts\python.exe manage.py migrate
.\.venv-win\Scripts\python.exe manage.py test
.\.venv-win\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Esta entrega adiciona o backend. As telas continuam usando os mocks até trocar suas fontes pelas rotas acima. O projeto está configurado para desenvolvimento local com SQLite. Agregações são calculadas sob demanda; bases grandes precisarão de paginação, agregações em lote e índices conforme volume observado. Não há exportação BI, recuperação de senha ou leitura de câmera porque essas funções não estão implementadas no frontend atual.
