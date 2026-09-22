# Reprodução de vídeos

Materiais do tipo vídeo abrem em um diálogo na própria página, sem link externo na interface. Fechar o diálogo desmonta o player e interrompe a reprodução. Os outros tipos de materiais mantêm o comportamento anterior.

Formatos aceitos: links do YouTube (watch, youtu.be, embed, shorts e live), Vimeo (incluindo o hash de vídeos não listados) e arquivos MP4, WebM, OGV/OGG. Outros endereços exibem uma orientação para contatar o professor, sem abrir outra aba. O provedor precisa permitir incorporação; arquivos dependem de codecs compatíveis com o navegador.

Isso não é proteção contra cópia: URLs continuam visíveis nas ferramentas de desenvolvimento e players de terceiros podem oferecer seus próprios links. O atributo `nodownload` apenas oculta um controle nos navegadores compatíveis. Não há criptografia, proxy ou controle de domínio implementado por esta mudança.

Para restringir a incorporação ao domínio da plataforma, configure essa proteção no provedor de hospedagem, por exemplo nas configurações de privacidade por domínio do Vimeo: https://help.vimeo.com/hc/en-us/articles/30030693052305-How-do-I-set-up-domain-level-privacy . O domínio autorizado deve ser o do frontend publicado. Links públicos não passam a ser privados por serem exibidos no diálogo.
