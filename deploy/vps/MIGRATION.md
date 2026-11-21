# Migração Render + Neon → Hostinger / Coolify

## Implantação

Use o projeto LittleBigCoders separado dos recursos existentes. Crie PostgreSQL 18 dedicado, com volume persistente, SSL `require` e acesso público desativado. O Django já exige TLS na conexão; copie a URL interna depois de habilitar SSL. Preserve essa configuração de produção.

Crie duas aplicações Git no Coolify, usando o repositório existente e o build pack Dockerfile:

| Aplicação | Base directory | Dockerfile | Porta |
| --- | --- | --- | --- |
| API | `/LittleBIGCodersPlataform/backend` | `/Dockerfile` | 8000 |
| Frontend | `/LittleBIGCodersPlataform/frontend` | `/Dockerfile` | 80 |

O Dockerfile precisa estar no commit selecionado para que o Coolify o use. Configure domínios HTTPS de teste antes de apontar os domínios de produção. Na API, configure:

- `DJANGO_SETTINGS_MODULE=config.production`
- `SECRET_KEY`: valor atual do backend, transferido por canal seguro; não colocar em Git nem no frontend.
- `DATABASE_URL`: URL interna do novo PostgreSQL com `sslmode=require`.
- `ALLOWED_HOSTS`: hostname exato da API.
- `CORS_ALLOWED_ORIGINS`: origem HTTPS exata do frontend.
- `CSRF_TRUSTED_ORIGINS`: origens HTTPS da API e do frontend.

Na implantação consolidada em `compose.yaml`, o frontend usa `VITE_API_URL=/api` e o Nginx encaminha a API pela rede Docker. O domínio não fica incorporado no build. `API_UPSTREAM` identifica o serviço interno. A porta do Nginx fica privada, atrás do proxy HTTPS ou do túnel SSH; não a publique diretamente em HTTP. O TLS público fica no Traefik já instalado. Configure o healthcheck da API em `/api/token/`, método GET, código esperado 405; envie o Host correto e `X-Forwarded-Proto: https` no teste interno. O frontend tem `/healthz` (200). Consulte `READY.md` para a implantação atual e o comando de configuração do domínio.

O container da API não executa migrations automaticamente. Restaure os dados primeiro e execute uma única vez `python manage.py migrate --noinput` no terminal da API. Verifique `python manage.py check --deploy` antes da liberação.

## Exportação e ensaio de restauração

Em 21/11/2026 a listagem do Neon informou `main` como `archived`, mas uma consulta SQL subsequente respondeu normalmente (32 tabelas públicas). Confirme que esse é o banco usado pelo backend publicado antes da exportação. Não substitua os dados por SQLite local.

Use cliente PostgreSQL 18 e conexão direta (sem `-pooler`) no `pg_dump`. Faça uma exportação completa em formato custom. Os comandos abaixo são para Bash no ambiente que já possui os clientes PostgreSQL; a leitura oculta evita gravar credenciais no histórico:

```bash
umask 077
mkdir -p backups
read -rsp 'URL direta da origem: ' SOURCE_DATABASE_URL; printf '\n'
archive="backups/littlebigcoders-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname="$SOURCE_DATABASE_URL" --format=custom --no-owner --no-acl --file="$archive"
pg_restore --list "$archive" > "$archive.list"
sha256sum "$archive" > "$archive.sha256"
unset SOURCE_DATABASE_URL
```

Guarde uma cópia fora da VPS. O dump contém dados privados e hashes de senha. Não o coloque no repositório, em imagens Docker ou em diretórios web. Antes de copiar credenciais pelo painel, use HTTPS ou o console autenticado da Hostinger; o endereço inicial do Coolify está em HTTP.

Restaure primeiro em um banco novo e vazio, dedicado ao ensaio. Confirme o destino antes do comando; não use `--clean` nem apague o banco original:

```bash
read -rsp 'URL do banco vazio de destino: ' TARGET_DATABASE_URL; printf '\n'
pg_restore --dbname="$TARGET_DATABASE_URL" --no-owner --no-acl --exit-on-error --single-transaction "$archive"
unset TARGET_DATABASE_URL
```

Compare origem e destino: tabelas, contagens exatas, migrations aplicadas, sequências, usuários e permissões, livros/capas, capítulos, desafios, materiais e progresso. Verifique extensões e objetos específicos do Neon no índice do dump antes de restaurar. Roles do provedor não são transferidas; `--no-owner --no-acl` atribui os objetos ao usuário do destino. Confira se o usuário de runtime precisa de permissões menores.

O arquivo `verify-data.sql` gera contagens e assinaturas de conteúdo de todas as tabelas públicas. Execute em cada banco com `psql -At -v ON_ERROR_STOP=1 -f deploy/vps/verify-data.sql`, mantendo os mesmos parâmetros de sessão, e compare as saídas antes de executar migrations ou liberar gravações. A comparação cobre os registros, mas sequências, índices, constraints, extensões e permissões precisam de verificação adicional.

As capas e imagens novas estão no banco como Data URI. Verifique campos de arquivos e `MEDIA_ROOT` para descobrir arquivos antigos ainda usados; copie esses arquivos separadamente para volume persistente e configure sua entrega antes de liberar. Não publique a pasta de mídia inteira sem revisar os arquivos.

## Troca definitiva e recuperação

1. Testar login e permissões de aluno, professor e administrador; livros, capas, desafios, progresso e relatórios na cópia.
2. Configurar backups do PostgreSQL com retenção e cópia externa; realizar um teste de restauração. O backup semanal da VPS não substitui esse teste.
3. Definir janela de manutenção e domínio definitivo. Suspender gravações no backend antigo e confirmar que não há outras origens escrevendo.
4. Exportar novamente, restaurar em novo destino vazio e validar; o dump do ensaio pode estar desatualizado.
5. Executar migrations uma vez e publicar API e frontend apontando para o destino definitivo. Atualizar hosts, origens e DNS, mantendo uma única fonte de gravação.
6. Validar HTTPS, autenticação, persistência após reinício, backups e logs; só então liberar gravações e acompanhar.

Antes de novas gravações na VPS, é possível voltar ao backend antigo e ao Neon. Após novas gravações, uma volta simples perde dados: parar gravações e reconciliar/exportar o destino antes de voltar. Manter Render e Neon até a validação final.

Referências: [SSL no Coolify](https://coolify.io/docs/databases/ssl), [PostgreSQL no Coolify](https://coolify.io/docs/databases/postgresql), [exportação PostgreSQL do Neon](https://neon.com/docs/guides/export-neon-postgres-compatible).
