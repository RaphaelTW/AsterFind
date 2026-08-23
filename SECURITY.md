# Segurança — AsterFind

## Modelo de segurança

- canais aleatórios por compartilhamento;
- tokens diferentes para publicar, visualizar e enviar comando;
- tokens armazenados no D1 apenas como SHA-256;
- payload criptografado com TweetNaCl secretbox;
- chave do payload nunca enviada ao relay;
- TLS obrigatório entre app e Worker;
- validade por canal;
- sem credenciais fixas embutidas no APK.

## O que não fazer

- não publique seu arquivo `.env`;
- não publique keystores Android;
- não coloque token do Cloudflare ou GitHub dentro do aplicativo;
- não reutilize links de convite em público;
- revogue compartilhamentos que não são mais necessários.

## Relato de vulnerabilidade

Use o repositório do projeto no GitHub para abrir uma issue sem incluir segredos, tokens ou localização real.
