# Acessos aos livros por turma

No painel administrativo, abra **Cadastros → Acessos aos livros**. Escolha a turma (identificada pela escola e ano), o livro, a validade inclusiva e a situação. Em **Visualizar e editar**, pesquise, renove, desative ou remova o vínculo.

O endpoint administrativo `/api/admin/class-book-accesses/` permite CRUD somente para administradores. Há um vínculo por par turma/livro; renovações editam esse registro. Datas invertidas são rejeitadas.

O acesso é calculado pela matrícula atual, sem copiar registros individuais: alunos adicionados posteriormente recebem acesso, e alunos removidos deixam de recebê-lo por essa turma. Turmas vazias podem ser configuradas antecipadamente. A escola do aluno deve coincidir com a da turma. O livro precisa estar ativo e o vínculo deve estar ativo e dentro da validade.

Vínculos individuais e de outras turmas são independentes; remover um vínculo não revoga os demais nem apaga respostas. A associação antiga no cadastro do livro continua organizando turmas/professores, mas não substitui esta liberação com validade.

Antes de iniciar o backend atualizado, aplique `python manage.py migrate`. No Render, o comando de inicialização existente aplica a migração automaticamente após o deploy.
