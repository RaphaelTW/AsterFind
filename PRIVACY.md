# Privacidade — AsterFind

## Princípios

O AsterFind foi projetado para localização consentida. Não existe modo oculto.

## Dados no aparelho

O aplicativo pode armazenar localmente:

- configurações de idioma e aparência;
- canais pareados;
- metadados de compartilhamentos;
- tokens e chaves dos canais em armazenamento seguro do sistema.

## Dados no relay

O relay armazena somente o último pacote criptografado de estado, o último comando criptografado, hashes dos tokens e datas de validade.

A chave usada para criptografar o conteúdo não é enviada ao relay.

## Localização em segundo plano

Somente é ativada quando existe um pareamento/publicação ativa e após permissões do usuário.

## Revogação

Ao desativar um compartilhamento, o canal é removido do relay quando a conexão estiver disponível. Compartilhamentos também expiram automaticamente.
