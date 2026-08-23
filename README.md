# AsterFind

**Localização de dispositivos com privacidade, consentimento e controle nas mãos do usuário.**

AsterFind é um aplicativo open source para visualizar seus próprios aparelhos e compartilhar localização com pessoas de confiança. O projeto combina uma experiência moderna de mapa com criptografia no dispositivo, compartilhamentos temporários e uma arquitetura que coleta somente o necessário.

O aplicativo foi criado com identidade e código próprios. Ele não depende de APIs privadas de fabricantes e não possui vínculo com Samsung Find, Google Find Hub ou Find My da Apple.

## O que o AsterFind oferece

- localização dos seus aparelhos em um mapa interativo;
- compartilhamento consentido de localização com contatos;
- convites seguros para pareamento e compartilhamento;
- períodos de compartilhamento de 1 hora, 8 horas, 24 horas, 7 dias ou até a revogação;
- latitude, longitude e precisão estimada do GPS;
- endereço aproximado por geocodificação reversa;
- distância entre o usuário e o aparelho selecionado;
- nível e estado de carregamento da bateria;
- indicação de atividade e horário da última comunicação;
- localização em segundo plano, respeitando as regras do sistema operacional;
- comando para tocar aparelhos autorizados;
- temas claro e escuro seguindo o sistema;
- interface em português, inglês, espanhol, alemão, italiano, russo, chinês simplificado, japonês e hindi;
- verificação de novas versões pelas Releases do GitHub.

## Privacidade por princípio

O AsterFind foi projetado para compartilhamento transparente e autorizado. Não existe modo oculto, ativação silenciosa ou rastreamento de terceiros sem consentimento.

As informações de localização são criptografadas no aparelho antes da transmissão. O relay usado para a comunicação remota recebe apenas identificadores aleatórios, credenciais protegidas e pacotes cifrados. A chave necessária para ler a localização não é enviada ao servidor.

O usuário pode interromper um compartilhamento a qualquer momento. O aplicativo não possui publicidade, rastreadores comerciais ou venda de dados.

## Como funciona

Para localizar seus próprios aparelhos, o usuário gera um convite de pareamento e o confirma no segundo dispositivo. Após a autorização, as atualizações aparecem no mapa com os dados disponíveis de localização, bateria e última comunicação.

Para compartilhar com outra pessoa, o AsterFind cria um convite seguro. A pessoa que compartilha escolhe a duração e precisa aceitar explicitamente antes que qualquer atualização seja enviada.

Na comunicação remota, o celular cifra os dados localmente e envia somente o pacote criptografado ao relay. Apenas outro dispositivo autorizado possui a chave para descriptografá-lo.

```text
Dispositivo autorizado
        ↓ criptografia local
Relay AsterFind
        ↓ pacote criptografado
Dispositivo autorizado
        ↓ descriptografia local
Mapa e informações do aparelho
```

## Mapa e localização

O mapa utiliza MapLibre e dados do OpenStreetMap, evitando uma dependência obrigatória de mapas pagos no aplicativo. A posição pode combinar GPS, Wi-Fi e rede móvel conforme os recursos disponibilizados pelo Android ou iOS.

A precisão apresentada é uma estimativa fornecida pelo sistema. O endereço depende da qualidade dos dados cartográficos e pode não identificar corretamente o número de um imóvel.

## Estados do aparelho

Quando um dispositivo deixa de se comunicar, o AsterFind mostra a última localização conhecida e o tempo desde a última atualização. O aplicativo usa termos como **offline** ou **sem comunicação**, pois não é possível distinguir com certeza entre aparelho desligado, ausência de internet, modo avião, aplicativo encerrado ou restrição do sistema operacional.

Um telefone sem bateria, fisicamente desligado ou totalmente inacessível não pode enviar localização nem receber o comando de toque.

## Tecnologias

- React Native e Expo;
- TypeScript em modo estrito;
- MapLibre e OpenStreetMap;
- Expo Location, Task Manager, Battery e SecureStore;
- criptografia autenticada com TweetNaCl;
- Cloudflare Workers e D1 para comunicação mínima entre aparelhos.

## Código aberto

O código, a documentação, o histórico de versões e os downloads oficiais do AsterFind são publicados neste repositório. Problemas de segurança devem ser comunicados conforme a [política de segurança](SECURITY.md), sem exposição pública de informações sensíveis.

Consulte também a [política de privacidade](PRIVACY.md) e o [histórico de mudanças](CHANGELOG.md).

## Licença

Distribuído sob a [Apache License 2.0](LICENSE).

---

AsterFind não é afiliado, patrocinado ou endossado pela Samsung, Google, Apple, OpenStreetMap Foundation ou Cloudflare. Todas as marcas pertencem aos seus respectivos titulares.
