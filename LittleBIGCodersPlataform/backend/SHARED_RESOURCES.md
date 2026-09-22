# Materiais e desafios compartilhados

Modelo: `Book 1:N Chapter N:N Material 1:0..1 Quiz`.

A tabela associativa `content_material_chapters` armazena cada par material/capítulo uma única vez. Um desafio é a especialização de um material do tipo `quiz`; seus capítulos são os do material. Assim, questões, alternativas e tentativas não são duplicadas ao compartilhar um desafio.

## Painel e API

- Em Materiais ou Desafios, cadastre recursos independentes, sem selecionar capítulos. Editar o conteúdo nessas telas preserva os vínculos existentes.
- Somente na tela Capítulos, selecione materiais e desafios já cadastrados. O mesmo recurso pode ser selecionado em capítulos de livros diferentes. Desmarcar remove somente o vínculo.
- É possível manter recursos sem capítulos no banco de recursos; não ficam disponíveis para alunos.
- Alterar um conteúdo compartilhado altera todas as suas aparições. Excluir um capítulo não exclui seus recursos. Excluir um recurso é global e continua sujeito às proteções de histórico.
- `admin/materials/` e `admin/quizzes/` recebem e retornam `chapters: [id, ...]`. O campo legado `chapter` continua aceito na escrita como uma lista de um elemento, mas não pode ser enviado junto com `chapters`.
- `admin/chapters/` recebe e retorna `material_ids: [id, ...]`, incluindo materiais do tipo quiz. As sequências didáticas continuam específicas de um capítulo.

## Acesso e desempenho

O aluno precisa ter acesso válido a pelo menos um livro que contenha o recurso. Filtrar por um capítulo não autorizado não retorna seus materiais. Restrições de gabaritos, recursos exclusivos do professor e desafios inativos continuam valendo.

As tentativas continuam sendo registradas por aluno/desafio, não por ocorrência no capítulo. O mesmo resultado aparece nos capítulos que compartilham o desafio; os totais gerais e por livro contam o desafio uma única vez. Uma aplicação independente, com outro histórico, exige criar outro desafio.

## Migração

`0006_shared_materials` cria a relação N:N, copia todos os vínculos antigos e só então remove a antiga chave `Material.chapter`. IDs, questões, respostas e tentativas são preservados. A migração não tem reversão automática, pois vários vínculos não caberiam novamente numa única chave. Faça backup antes do deploy; para rollback completo, restaure banco e versão compatíveis juntos.

Execute `python manage.py migrate` antes de iniciar o backend atualizado. O comando de inicialização do Render já executa as migrações. Publique frontend e backend juntos, pois a leitura administrativa passa a utilizar listas de capítulos.
