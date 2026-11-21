# Preparação para publicação

## Implantação privada

O Compose em `/opt/littlebigcoders/source/deploy/vps/compose.yaml` usa as imagens `littlebigcoders-api:ready` e `littlebigcoders-web:ready`. A configuração privada é `/opt/littlebigcoders/application.env` (0600). O frontend usa `/api` e encaminha para a API na rede Docker, sem incorporar o domínio no bundle.

```bash
docker compose -f /opt/littlebigcoders/source/deploy/vps/compose.yaml up -d --no-build
```

Apenas o frontend publica uma porta: `127.0.0.1:18000`. API e PostgreSQL ficam na rede interna. O listener do Nginx deve continuar privado, atrás do proxy HTTPS ou do túnel SSH. Ele substitui `X-Forwarded-Proto` por `https`; o HTTP público precisa ser redirecionado no proxy de borda.

## Testes de login

`accounts.test_authentication` usa um banco de testes isolado e contas sintéticas. Testa senha e JWT para os três papéis, perfil autenticado, senha incorreta, acesso anônimo, expiração/renovação, refresh inválido e conta inativa. Não altera senhas de usuários migrados. Os testes passaram localmente e no PostgreSQL 18 da VPS, com a configuração de produção.

O frontend e a API no mesmo endereço foram verificados na VPS: `/healthz` retornou 200; `/api/me/` sem token e login inválido retornaram 401. Um teste manual de login com uma conta migrada exige a senha existente; não redefina senhas para testar.

## Backup fora da VPS

`download-backup.py` baixa o arquivo autorizado via SSH e confere SHA-256 antes de concluir a cópia. O destino local previsto é `deploy/vps/backups/`, ignorado pelo Git. O dump contém dados privados. Essa cópia no computador é independente da VPS, mas não é um serviço de backup recorrente em nuvem.

```powershell
python deploy/vps/download-backup.py --key tmp/.env.vps-transfer-key --known-hosts tmp/vps-known-hosts --destination deploy/vps/backups
```

O acesso temporário proposto não concede shell, PTY, encaminhamento de agente ou X11. Permite apenas ler o dump fixo e seu hash, além de encaminhar a porta privada do frontend. Só instalar após confirmação do usuário e remover ao encerrar. A chave proposta expira em 21/11/2026 às 23:59:59 UTC (20:59:59 em Bahia).

Esse acesso foi autorizado, usado e revogado em 21/11/2026. A cópia externa foi verificada por SHA-256 e o login real foi confirmado no navegador. O túnel foi encerrado e os arquivos locais da chave foram removidos. O comando de download acima é uma referência para uma transferência futura com novo acesso autorizado; a chave desse ensaio já não existe.

## Quando houver acesso ao domínio

1. Confirmar o banco usado pelo serviço atual e executar a sincronização final com gravações suspensas, conforme `MIGRATION.md`. A cópia de ensaio pode estar desatualizada quando o domínio estiver disponível.
2. Guardar uma cópia externa da exportação final e conferir a restauração. Manter Render/Neon para recuperação.
3. Configurar no UOL o registro A do hostname para `179.66.156.112`; remover AAAA conflitante e aguardar resolução.
4. Na VPS, executar:

```bash
python3 /opt/littlebigcoders/source/deploy/vps/configure-domain.py plataforma.seudominio.com
```

O comando valida DNS, atualiza hosts/origens do Django e configura o Traefik existente com redirecionamento HTTP → HTTPS e certificado Let's Encrypt. Não precisa reconstruir o frontend. Verificar certificado, login, acesso a livros e persistência antes de liberar gravações.

## Estado atual: publicado

Disponível em https://plataforma.littlebigcoders.com.br/#login, com certificado válido e redirecionamento HTTPS. Origem Neon preservada somente para leitura da aplicação, protegida também por gatilhos para sessões antigas do pool. Consulte STATUS.md e neon-readonly-rollback.sql antes de qualquer retorno à origem. A sincronização final foi verificada pelo manifesto das 32 tabelas; os dados eram idênticos.

## Site www e entrada da plataforma — 21/11/2026

- A pedido do usuário, criado A www.littlebigcoders.com.br para 179.66.156.112 na UOL. Consulta recursiva Google já confirmou o A.
- O www serve o site institucional com HTTPS próprio e HTTP redirecionado para HTTPS. Certificado validado externamente usando o IP resolvido publicamente (sem ignorar TLS). Alguns resolvedores locais ainda podem manter NXDOMAIN em cache.
- Entrar em plataforma.littlebigcoders.com.br/ agora normaliza a URL para /#login antes de renderizar a aplicação. O Login do www vai para a plataforma; Voltar ao site vai para www; sair da conta retorna ao login.
- Aplicação reconstruída e frontend atualizado; banco e API não precisaram de alteração.
- Reaplicar domínios com: python3 /opt/littlebigcoders/source/deploy/vps/configure-domain.py plataforma.littlebigcoders.com.br --site-domain www.littlebigcoders.com.br
