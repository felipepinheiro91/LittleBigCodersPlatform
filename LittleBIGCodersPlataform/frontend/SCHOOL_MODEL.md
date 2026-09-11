# Vínculo escolar integrado

- A escola exibida vem de `GET /api/me/`, junto dos IDs de professor ou estudante.
- As turmas vêm de `GET /api/classes/`; o backend restringe a consulta ao perfil autenticado.
- Os estudantes de uma turma são consultados em `GET /api/classes/{id}/students/`.
- Professor, turma e alunos matriculados devem pertencer à mesma escola. Essa validação é feita no Django.
- Estudantes de compra individual podem não ter escola; a interface exibe “Sem escola vinculada”.
- Livros e materiais respeitam os vínculos e a validade de acesso retornados pelo servidor.
- Os filtros do dashboard usam IDs reais. O servidor verifica novamente se o usuário pode consultar cada ID.
- Os dados demonstrativos e o login de demonstração foram removidos do frontend.
