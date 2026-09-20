# Render + Neon

Arquitetura: React/Vite como Static Site no Render, Django como Web Service no Render e PostgreSQL no Neon. Nenhum recurso externo foi criado. O ambiente local continua usando SQLite e `config.settings`.

## Preparação

1. Crie um projeto PostgreSQL no Neon. Copie a conexão **direta**, mantendo `sslmode=require`. Use uma branch de desenvolvimento para validar migrations antes da produção.
2. Crie um bucket privado S3 (ou compatível) para capas, com credenciais restritas a leitura/escrita nesse bucket. Arquivos locais do Render são efêmeros; o banco guarda o caminho da imagem, não o arquivo.
3. No Render, conecte o repositório e crie um Blueprint usando `render.yaml` na raiz. Confira os planos e custos antes de confirmar. Não é criado banco no Render.

## Variáveis da API

- `DJANGO_SETTINGS_MODULE=config.production` (já definido no Blueprint).
- `SECRET_KEY`: gerada pelo Render, nunca reutilize a chave de desenvolvimento.
- `DATABASE_URL`: conexão direta do Neon, apenas no backend. Nunca use prefixo `VITE_` para segredos.
- `CORS_ALLOWED_ORIGINS`: URL HTTPS exata do frontend, sem barra final; múltiplas origens separadas por vírgula.
- `CSRF_TRUSTED_ORIGINS`: URL HTTPS da API para o Django Admin; acrescente a do frontend se necessário.
- `ALLOWED_HOSTS`: apenas para domínios personalizados, sem protocolo. O domínio padrão do Render é incluído automaticamente.
- `AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_REGION_NAME`: dados do bucket. Em provedores compatíveis, acrescente `AWS_S3_ENDPOINT_URL` no painel do Render.

As variáveis devem ser configuradas no Render, não commitadas. A configuração de produção recusa iniciar sem banco, chave e armazenamento, evitando salvar uploads em disco temporário. As capas usam URLs assinadas; não é necessário tornar o bucket público.

## Frontend e primeira publicação

Defina `VITE_API_URL=https://DOMINIO-DA-API/api`. Vite incorpora esse endereço no build: alterações exigem novo deploy do frontend. Atualize as origens da API com o domínio efetivo do frontend.

O build instala dependências e coleta arquivos estáticos. O início executa migrations e Gunicorn. O comando fornecido pressupõe uma única instância da API; antes de escalar, mova migrations para uma etapa de pré-deploy única. Para usar conexão pooled no runtime, execute migrations com uma conexão direta em uma etapa separada.

No shell do serviço, crie sua conta inicial:

```sh
python manage.py createsuperuser
```

Informe `admin` no campo `role`. Defina uma senha nova, sem reutilizar credenciais de teste. O banco do Neon começa vazio: dados e capas locais não são transferidos automaticamente. Planeje exportação/importação separadamente, com backup; não publique SQLite, senhas ou dados de alunos no Git.

## Verificação

```sh
python manage.py check --deploy
```

Teste login, criação de livro/capa, capítulo, desafio e sequência didática. Após reiniciar o serviço, confirme que a capa continua acessível. A conexão real ao Neon e o upload ao bucket só podem ser validados depois de configurar os serviços.

Os avisos `security.W005` e `security.W021` são esperados: HSTS não é aplicado automaticamente a subdomínios nem incluído em listas de preload. Só habilite essas opções depois de confirmar domínio e HTTPS de todos os subdomínios.

O `.gitignore` evita novos arquivos sensíveis, mas não remove arquivos já rastreados. Antes de publicar o repositório, revise `git ls-files` para bases SQLite, uploads, ambientes virtuais e credenciais; remova-os do versionamento sem apagar os arquivos locais e trate segredos eventualmente expostos no histórico.

Referências: https://render.com/docs/deploy-django · https://render.com/docs/disks · https://neon.com/docs/manage/endpoints · https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html
