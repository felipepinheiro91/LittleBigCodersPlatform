# Deploy automático da VPS

O serviço `littlebigcoders-cd.timer` consulta a branch **develop** do repositório
`felipepinheiro91/LittleBigCodersPlatform` a cada 60 segundos. Após um push nessa
branch, a VPS busca o commit e faz o deploy sem depender deste computador.
Push em `main` ou em outra branch não publica em produção.

O acesso ao repositório público é somente de leitura por HTTPS. Não há chave SSH,
token do GitHub, webhook público nem runner com acesso de entrada à VPS.

## Etapas

1. Obter o SHA exato da branch e exportar os fontes para uma pasta por commit.
2. Construir API e frontend com tags imutáveis e o SHA nas imagens.
3. Executar verificações Django e testes de autenticação em SQLite isolado.
4. Validar Compose e criar um dump privado do PostgreSQL antes das migrations.
5. Executar migrations uma única vez e atualizar somente o projeto Compose
   `littlebigcoders`, preservando domínios, configuração privada e banco dedicado.
6. Conferir imagens ativas, frontend e autenticação inválida consultando a API.
7. Registrar o SHA em `/opt/littlebigcoders/cd/deployed.json` somente após sucesso.

Falhas de build ou validação preservam os containers em execução. Falhas após a
troca restauram as imagens da aplicação anterior. **Migrations do banco não são
revertidas automaticamente**: prefira mudanças compatíveis com ambas as versões.
O dump pré-deploy permite recuperação manual; não é uma cópia externa recorrente.

Commits que falharam não são repetidos a cada minuto. Um novo push libera uma nova
tentativa; para repetir o mesmo SHA, execute manualmente com `--retry`.

## Operação

```bash
systemctl status littlebigcoders-cd.timer
journalctl -u littlebigcoders-cd.service -n 100 --no-pager
cat /opt/littlebigcoders/cd/deployed.json
# Nova tentativa manual (evitar concorrência com manutenção):
python3 /opt/littlebigcoders/cd/cd.py --retry
# Pausar publicação automática para manutenção:
systemctl stop littlebigcoders-cd.timer
# Reativar:
systemctl enable --now littlebigcoders-cd.timer
```

O executor instalado em `/opt/littlebigcoders/cd/cd.py` e os units são cópias
administradas no servidor. Mudanças nesses arquivos requerem reinstalação explícita;
o CD publica automaticamente os fontes e o Compose da aplicação, não altera o próprio
serviço systemd. Os labels de domínio ficam em
`/opt/littlebigcoders/cd/domain.override.json`, separados dos releases.

Ao alterar os domínios, prepare-os pelo `configure-domain.py`, copie o override
resultante para o diretório `cd` e reaplique o Compose registrado em `deployed.json`.
Não execute o Compose antigo com as tags `ready` depois de ativar CD.

Releases, imagens e dumps são preservados. Acompanhe o espaço em disco e estabeleça
retenção conforme a necessidade operacional; nenhum backup é apagado pelo executor.
