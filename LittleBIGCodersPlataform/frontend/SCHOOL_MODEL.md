# Vínculo escolar

Os dados demonstrativos ficam em `src/schoolModel.js`. Escola Horizonte é fictícia.

- Escola possui vários professores, alunos e turmas.
- Usuário contém a identidade e o papel; o perfil de professor ou aluno contém `school_id`.
- Cada perfil escolar está vinculado a uma escola.
- Turma contém `school_id` e `teacher_id`; o professor deve pertencer à escola da turma.
- Matrícula relaciona `student_id` e `class_id`; aluno e turma devem pertencer à mesma escola.
- `getDemoUser` produz o contrato de sessão com `school_id`, `teacher_id` ou `student_id`, compatível com o perfil retornado pelo Django. O objeto `school` enriquece a apresentação.
- `getSchoolClasses` resolve as turmas pelo vínculo escolar e pelo professor ou pelas matrículas do aluno.

A sessão demonstrativa do professor Rafael e da aluna Lia está ligada à Escola Horizonte. Lia está matriculada no 5º A. As contagens e métricas existentes permanecem exemplos agregados, não um cadastro completo de alunos. Os painéis de BI ainda usam mocks independentes.

## Integração futura

O Django já contém `Student.school`, `Teacher.school` e `Class.school`. Os dois primeiros aceitam nulo atualmente. O modelo escolar proposto exige vínculo para perfis escolares; compras individuais previstas nos requisitos precisam de um fluxo explícito antes de tornar o campo obrigatório no banco.

Ao integrar, validar no servidor a escola do professor responsável e do aluno matriculado. Filtrar consultas por escola e autorização do usuário autenticado, sem confiar em IDs enviados pelo navegador. A função de frontend organiza a apresentação e não substitui controle de acesso. Não houve alteração de banco ou migração nesta etapa.
