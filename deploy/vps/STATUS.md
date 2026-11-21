# Preparação da migração — 21/11/2026

- VPS Hostinger: `srv2182840.hstgr.cloud`, `179.66.156.112`.
- Ubuntu 24.04, Coolify, 2 vCPU, 8 GB RAM, 100 GB disco.
- Há uma aplicação e um PostgreSQL preexistentes: preservar esses recursos.
- Projeto Coolify LittleBigCoders: `erymevcgdl9hohfmitzlfn4w`.
- Ambiente inicial production: `qg04eacwhdd1xndemfwrv0us`.
- Origem Neon: projeto `jolly-paper-81081800`, PostgreSQL 18.
- Branch principal `br-aged-grass-b5uesl65` (`main`): a listagem informou `archived`, mas a consulta SQL funcionou em seguida. Banco `neondb`, servidor 18.7, 32 tabelas públicas, 16.121.856 bytes no momento da consulta.
- Console Hostinger funciona. SSH local ainda não autenticado.
- PostgreSQL de destino `littlebigcoders-postgres`, recurso `qf0bkfpgx2xihwqp62b65rpo`, imagem `postgres:18-alpine`, banco `littlebigcoders`.
- Destino iniciado e verificado no console: `running healthy`, SSL `on`, nenhuma porta publicada (`PortBindings {}`). Estava vazio antes da restauração.
- Certificado SSL gerado pelo Coolify; acesso Private e modo `require` verificados no painel.
- Dockerfiles de backend e frontend e Nginx para as rotas React preparados localmente e testados na VPS; ainda não publicados no Git. Containers privados de ensaio em execução, fora da gestão das aplicações do Coolify; o banco é gerenciado pelo Coolify.
- Testes locais: três testes de configuração de produção passaram; build Vite passou; collectstatic em dry-run passou; check --deploy teve apenas os avisos HSTS W005 e W021 já documentados.
- Docker Desktop local não estava em execução; a validação dos containers foi direcionada para a própria VPS.
- A branch local é `develop`, commit `5467ee58476dee1ea9b9871d4126599833b76786`; o HEAD padrão remoto informado pela VPS foi `427272c1187994bad47830b659e29c98c4fed8e9`. Escolher explicitamente a revisão a implantar.
- Pendente: domínio, implantação pública das aplicações, confirmação do banco usado pelo backend atual, backup externo e troca de produção.
- A pedido do usuário, domínio/DNS ficam para depois (domínio UOL indisponível no momento).
- Dump custom da origem exportado pela conexão direta para `/opt/littlebigcoders/migration/backups/neon-rehearsal-20261121-v2.dump`, com índice e SHA-256; restaurado com sucesso no destino vazio, em transação única.
- Contagens e assinaturas do conteúdo das 32 tabelas coincidem. SHA-256 do manifesto: `1bdcc10551da5ebe3add61aa8ecefaf2f855a3bc60b6aa59ef034a452d21fcc2`.
- Conferência adicional: 31 sequências com valores/estado idênticos (assinatura `8e86c568fadf0b90ec53883c726407ab`), 104 índices e 272 constraints em ambos os bancos.
- A primeira tentativa de exportação falhou (URL passada em PGDATABASE sem dbname explícito); o arquivo correspondente ficou vazio e não foi usado na restauração.
- A branch remota develop coincide com o commit local. Checkout seletivo em `/opt/littlebigcoders/source`, com ambientes virtuais, SQLite, mídia, caches e node_modules excluídos; imagens `littlebigcoders-api:rehearsal` e `littlebigcoders-web:rehearsal` construídas com sucesso.
- Teste inicial do runtime encontrou permissões de arquivos preservadas pelo checkout com umask 077. Dockerfile corrigido com `COPY --chown=app:app`; API continua executando como UID 10001.
- Containers `littlebigcoders-api-rehearsal` (127.0.0.1:18001, limite 512 MB) e `littlebigcoders-web-rehearsal` (127.0.0.1:18000, limite 128 MB), com reinício automático. Sem publicação dessas portas nas interfaces externas.
- Testes na imagem final: `migrate --check` passou; conexão Django/PostgreSQL confirmou TLS; leitura autenticada de livros passou para admin, teacher e student com APIClient/force_authenticate, sem expor registros. Isso não substitui teste de login com senha/JWT no navegador.
- Smoke tests: API/token GET 405, livros sem autenticação 401, frontend healthz 200 e fallback React retornando HTML. `check --deploy` teve apenas W005/W021 já conhecidos.
- Frontend de ensaio usa `VITE_API_URL=https://api.example.test/api`: serve para validar build/servidor estático; requer novo build com o endereço real antes do uso. Integração completa frontend/API e login no navegador ainda pendentes.
- Segredos de ensaio em `/opt/littlebigcoders/rehearsal.env` (0600); chave Django exclusiva de ensaio. Credencial de origem usada na exportação não foi gravada no histórico. Não reutilizar essa configuração como produção sem revisar permissões e variáveis.
- Scripts e logs de ensaio: `/opt/littlebigcoders/build-rehearsal.sh`, `api-check.py`, `web-check.py`, `final-check.log`. Cópia do dump ainda está somente na VPS: falta cópia externa e rotina de backup antes da troca definitiva.
- A cópia na VPS é um ensaio; a produção ainda usa os serviços anteriores. Render/Neon e os recursos preexistentes da VPS não foram alterados.

Registrar abaixo as etapas efetivamente concluídas; criar recursos não significa que a migração esteja concluída.

## Backup externo — continuação de 21/11/2026

- Preparado `download-backup.py` para transferência binária via SSH e verificação SHA-256.
- Arquivo de origem na VPS: 3.035.868 bytes; o dump já passou pelo ensaio de restauração.
- Identidade SSH conferida pelo console HTTPS: `SHA256:0b/ahlSeoXNA4xdXX0fT7YdKVsVUysk8OrUPRcjtAFw`.
- As chaves locais existentes não autenticaram. Uma chave temporária nova foi gerada localmente, mas NÃO instalada: aguarda autorização solicitada ao usuário.
- A proposta limita comandos ao dump fixo e seu hash, mais túnel para `127.0.0.1:18000`; sem shell/PTY/agente/X11, com expiração hoje em UTC e remoção ao encerrar.
- O destino previsto é este computador, em `deploy/vps/backups/` (ignorado pelo Git). A cópia externa ainda não foi realizada; não declarar backup externo concluído.

## Testes de login — continuação de 21/11/2026

- Quatro testes de autenticação adicionados em `accounts/test_authentication.py` e aprovados localmente e no container de produção com PostgreSQL 18.
- Cobertura: senha e JWT válidos para admin/teacher/student, perfil autenticado, senha incorreta, acesso anônimo, token expirado, renovação válida, refresh inválido e conta inativa.
- Usado banco de testes isolado; senhas e usuários migrados preservados.
- Proxy privado unificado verificado: health 200, perfil anônimo 401 e senha inválida 401.
- Login manual no navegador com conta migrada ainda não realizado; exige túnel autorizado e senha existente fornecida pelo próprio usuário na interface.

## Implantação preparada para domínio

- Imagens finais `littlebigcoders-api:ready` e `littlebigcoders-web:ready` construídas.
- Nova implantação com Compose em `/opt/littlebigcoders/source/deploy/vps/compose.yaml`, containers `littlebigcoders-api-1` e `littlebigcoders-web-1` em execução.
- API sem porta publicada; frontend apenas em `127.0.0.1:18000`. Containers antigos de ensaio parados e preservados para recuperação.
- Frontend agora usa `/api` no mesmo endereço; não precisa de rebuild ao escolher o domínio.
- `/opt/littlebigcoders/application.env` contém a configuração privada (0600), baseada no ambiente de ensaio.
- `configure-domain.py` preparado para validar DNS, atualizar hosts/origens e aplicar redirecionamento HTTPS e Let's Encrypt pelo Traefik existente. Script com sintaxe validada; emissão do certificado só poderá ser testada com o domínio.
- Instruções consolidadas em `READY.md`. A sincronização final dos dados continua necessária antes da troca pública, pois a origem pode receber gravações enquanto esperamos o domínio.

## Backup externo concluído após autorização

- Usuário autorizou explicitamente instalar a chave temporária e restrita, concluir a cópia/testes e remover a chave ao encerrar.
- Dump baixado para `deploy/vps/backups/littlebigcoders-20261121T151816Z.dump`, com 3.035.868 bytes.
- SHA-256 remoto e local conferidos: `7ec1dcb607d0b4339691b168cebc609ed2155f546547fdd8741d55a1e2afc0ad`.
- Arquivo `.dump.sha256` acompanha a cópia. Diretório ignorado pelo Git e ACL restrita ao usuário Windows atual e SYSTEM.
- Esse é o mesmo arquivo que foi restaurado com sucesso na VPS e comparado à origem (32 tabelas e 31 sequências). A integridade da cópia local foi verificada pelo checksum; não foi necessário reconstruir outro banco para repetir a mesma restauração.
- Diagnóstico SSH DEBUG3 temporário já removido e configuração original de logging restaurada.
- Túnel privado aberto para `127.0.0.1:18000`; tela real de login da VPS aberta no navegador. Aguardando verificação manual com a conta existente antes de fechar o túnel e revogar a chave.

## Login real e encerramento concluídos

- Usuário entrou com a conta existente e confirmou a abertura da plataforma.
- Verificado no navegador o painel autenticado de estudante com livro disponível, conquistas, pontuação e histórico de atividades carregados da cópia na VPS. Nenhuma senha foi lida ou redefinida.
- Processo exato do túnel SSH encerrado; conexão TCP em `127.0.0.1:18000` neste computador passou a ser recusada. A porta privada da aplicação na VPS continua ativa, como esperado.
- Removida somente a linha da chave temporária em `/root/.ssh/authorized_keys`, preservando byte a byte as demais linhas. Configuração SSH validada com `sshd -t`.
- Tentativa de nova autenticação com a chave removida retornou `Permission denied`, confirmando a revogação.
- Arquivos locais da chave privada e pública temporárias também removidos. O diagnóstico SSH temporário não existe mais.
- Backup externo concluído e login real validado; implantação permanece privada. Próxima etapa: domínio, certificado público e sincronização final antes da troca de produção.

## Publicação concluída em 21/11/2026

- Domínio: https://plataforma.littlebigcoders.com.br; DNS UOL propagado para 179.66.156.112.
- Traefik configurado pelo script versionado; redirecionamento HTTP 308 e TLS 1.3 com certificado Let's Encrypt YR2 válido até 19/02/2027, verificado externamente sem desabilitar validação.
- Página pública e healthz retornam 200; perfil anônimo retorna 401. Login real com conta migrada já aprovado pelo usuário na mesma implantação antes da publicação.
- API e frontend em execução; PostgreSQL saudável e privado. Manifesto final das 32 tabelas na origem e VPS permanece 1bdcc10551da5ebe3add61aa8ecefaf2f855a3bc60b6aa59ef034a452d21fcc2.
- Usuário autorizou explicitamente somente leitura no antigo neondb do Neon. Aplicados default_transaction_read_only no banco e no papel neondb_owner. O pool mantinha sessões com parâmetro antigo; por isso foram adicionados 32 gatilhos BEFORE STATEMENT, bloqueando INSERT/UPDATE/DELETE/TRUNCATE com SQLSTATE 25006. Teste sem alterar dados (UPDATE WHERE false) confirmou a rejeição em conexão pooled mesmo com read_only=off.
- Uma tentativa intermediária de revogar permissões DML do proprietário era insuficiente por herança de pg_write_all_data; permissões comuns foram restauradas antes dos gatilhos. Não há alterações de ACL pendentes.
- Origem preservada para recuperação; rollback operacional documentado em neon-readonly-rollback.sql. Não executá-lo enquanto a VPS aceita gravações.
- Corrigidas permissões de leitura dos arquivos estáticos no Dockerfile do frontend para que o nginx possa servir imagens copiadas do checkout restrito.
- Backup externo e revogação da chave SSH temporária seguem concluídos. Não há backup recorrente externo configurado.

## Site www e entrada da plataforma — 21/11/2026

- A pedido do usuário, criado A www.littlebigcoders.com.br para 179.66.156.112 na UOL. Consulta recursiva Google já confirmou o A.
- O www serve o site institucional com HTTPS próprio e HTTP redirecionado para HTTPS. Certificado validado externamente usando o IP resolvido publicamente (sem ignorar TLS). Alguns resolvedores locais ainda podem manter NXDOMAIN em cache.
- Entrar em plataforma.littlebigcoders.com.br/ agora normaliza a URL para /#login antes de renderizar a aplicação. O Login do www vai para a plataforma; Voltar ao site vai para www; sair da conta retorna ao login.
- Aplicação reconstruída e frontend atualizado; banco e API não precisaram de alteração.
- Reaplicar domínios com: python3 /opt/littlebigcoders/source/deploy/vps/configure-domain.py plataforma.littlebigcoders.com.br --site-domain www.littlebigcoders.com.br
