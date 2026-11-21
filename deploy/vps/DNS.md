# DNS de publicação

Endereço escolhido pelo usuário: `plataforma.littlebigcoders.com.br`.

Em 21/11/2026, o domínio estava delegado à AWS, mas os servidores recusavam consultas (`SERVFAIL`, com `REFUSED` na delegação). O usuário autorizou expressamente passar o DNS do domínio inteiro para a UOL, ciente de que a zona salva não tinha A do site principal nem MX de recebimento de e-mail.

Aplicado e confirmado no painel após recarregar:

- Utilizar servidores UOL: Sim.
- `ns1.dominios.uol.com.br`, `ns2.dominios.uol.com.br`, `ns3.dominios.uol.com.br`.
- Registro A `plataforma.littlebigcoders.com.br` → `179.66.156.112`, ativado.
- Mantidos os registros anteriores da zona: SOA, CNAME painel/sac e TXT SPF, DKIM e DMARC.

A resolução pública foi confirmada em 21/11/2026: registro A correto, HTTP 308 para HTTPS e certificado válido da Let's Encrypt (YR2), com vencimento em 19/02/2027. Endereço publicado: https://plataforma.littlebigcoders.com.br.

Não foi criado A para o domínio raiz nem MX: isso depende dos destinos reais desses serviços e não é necessário para publicar o subdomínio escolhido.

## Site www e entrada da plataforma — 21/11/2026

- A pedido do usuário, criado A www.littlebigcoders.com.br para 179.66.156.112 na UOL. Consulta recursiva Google já confirmou o A.
- O www serve o site institucional com HTTPS próprio e HTTP redirecionado para HTTPS. Certificado validado externamente usando o IP resolvido publicamente (sem ignorar TLS). Alguns resolvedores locais ainda podem manter NXDOMAIN em cache.
- Entrar em plataforma.littlebigcoders.com.br/ agora normaliza a URL para /#login antes de renderizar a aplicação. O Login do www vai para a plataforma; Voltar ao site vai para www; sair da conta retorna ao login.
- Aplicação reconstruída e frontend atualizado; banco e API não precisaram de alteração.
- Reaplicar domínios com: python3 /opt/littlebigcoders/source/deploy/vps/configure-domain.py plataforma.littlebigcoders.com.br --site-domain www.littlebigcoders.com.br

## Domínio sem www

Em 21/11/2026, usuário autorizou publicar também littlebigcoders.com.br. Criado registro A da raiz para 179.66.156.112, preservando TXT e demais entradas. Configurado alias HTTPS com redirecionamento permanente para https://www.littlebigcoders.com.br, preservando caminho e query string.

Comando completo para reaplicar: python3 /opt/littlebigcoders/source/deploy/vps/configure-domain.py plataforma.littlebigcoders.com.br --site-domain www.littlebigcoders.com.br --site-alias littlebigcoders.com.br
