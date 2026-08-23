# AsterFind

Localizador consentido, local-first e sem chave de API no aplicativo, feito com React Native + Expo.

> **Descrição para o GitHub:** Aplicativo open source de localização consentida para Android/iOS com mapa, rastreamento de aparelhos, compartilhamento temporário com contatos, bateria, distância, endereço, alerta sonoro e atualização por GitHub Releases — React Native + Expo, MapLibre/OpenStreetMap e relay criptografado opcional.

## Visão geral

O AsterFind foi desenhado para lembrar a experiência de Samsung Find e Localizador do Google sem copiar marcas, recursos proprietários ou componentes exclusivos. A interface usa cartões grandes, cantos arredondados, bottom navigation, tema automático claro/escuro e hierarquia visual inspirada na linguagem contemporânea da One UI.

O aplicativo tem dois níveis de funcionamento:

1. **Modo local**, que funciona sem backend: mostra o próprio aparelho no mapa, localização com alta precisão disponível pelo sistema, endereço, bateria, estado de rede e configurações.
2. **Modo remoto**, que permite localizar outro aparelho ou um contato autorizado. Isso exige um pequeno relay na internet. O projeto inclui um Cloudflare Worker + D1. O app não usa chave de API para chamar o relay: somente a URL pública do Worker e tokens aleatórios de cada compartilhamento.

## Por que existe um relay se os dados são locais?

Dois telefones em redes diferentes não conseguem trocar localização quase em tempo real de maneira confiável somente com armazenamento local. CGNAT, 4G/5G, Wi‑Fi e aparelhos em segundo plano impedem uma conexão direta permanente.

O relay do AsterFind **não é um banco de usuários**. Ele guarda somente:

- ID aleatório do canal;
- hashes dos tokens de autorização;
- último pacote de localização criptografado;
- último comando criptografado;
- validade do compartilhamento.

A opção **“Até eu desativar”** usa validade técnica até o ano 9999 e é encerrada quando o usuário revoga o canal.

Nome, coordenadas, bateria e outros dados ficam dentro do pacote criptografado. A chave de criptografia não é enviada ao relay.

## Recursos implementados

- mapa sem chave usando MapLibre + tiles do OpenStreetMap;
- localização GPS de alta precisão pelo `expo-location`;
- endereço por geocodificação reversa nativa do Android/iOS, sem API externa;
- rua, número, bairro/distrito, cidade, estado/região, CEP e país quando o sistema operacional tiver esses dados;
- raio de precisão em metros;
- distância em km entre o aparelho atual e o aparelho/contato selecionado;
- bateria e estado de carregamento;
- estado ativo/inativo calculado pela última atualização;
- tempo desde a última atualização;
- rastreamento em segundo plano com foreground service visível no Android;
- atualização-alvo de localização a cada ~10 s e consulta remota a cada ~10 s, sujeitas ao agendamento e às otimizações de bateria do sistema;
- pareamento de aparelho por link profundo;
- compartilhamento de localização por 1 hora, 8 horas, 1 dia, 7 dias ou até o usuário desativar;
- solicitação de localização: você envia o pedido e o contato, ao aceitar, escolhe por quanto tempo compartilhar;
- aceite explícito de convite;
- revogação de compartilhamento;
- comando de toque para aparelhos pareados;
- módulo nativo Android que toca no stream de alarme, eleva temporariamente o volume do alarme e vibra;
- acesso opcional à tela do Android para permissão de Não Perturbe;
- tema automático do sistema;
- idiomas: Português (Brasil), Inglês, Espanhol, Russo, Alemão, Italiano, Chinês, Japonês e Hindi;
- verificação de atualização pela release pública mais recente do GitHub;
- link somente para o GitHub do desenvolvedor;
- campo de doação via Pix configurável por variável de ambiente;
- versão do app em Configurações > Sobre;
- sem conta obrigatória no aplicativo;
- sem modo oculto.

## Limitações importantes

### Endereço e número da residência

A precisão do GPS e o endereço retornado são dados do sistema operacional. Em área aberta o GPS pode chegar a poucos metros, mas **não existe garantia de identificar o número exato de uma casa**. Em prédios, túneis e locais fechados a precisão pode piorar.

### Aparelho desligado

O AsterFind sabe quando recebeu a última atualização, mas não consegue distinguir com certeza entre:

- telefone desligado;
- sem internet;
- modo avião;
- aplicativo forçado a parar;
- sistema bloqueando tarefas em segundo plano.

Por isso a interface usa **Ativo/Inativo** e mostra há quanto tempo chegou a última atualização.

### Tocar mesmo no silencioso

No Android, o módulo nativo usa o stream de alarme e tenta elevar temporariamente o volume do alarme. Isso normalmente funciona mesmo se o volume de mídia estiver silencioso. Porém:

- `Não Perturbe` total pode impedir o áudio conforme a configuração do usuário;
- um aplicativo comum não deve desativar `Não Perturbe` sem ação explícita do usuário;
- se o app tiver sido forçado a parar pelo Android, nenhum código do AsterFind poderá executar até o usuário abrir o app novamente;
- se o telefone estiver desligado, não é possível tocar.

No iOS existem restrições ainda maiores. O módulo de volume máximo deste projeto é Android-only; no iOS o comportamento fica limitado ao que o sistema permite.

## Arquitetura

```text
asterfind/
├── apps/mobile/                 React Native + Expo SDK 57
│   ├── App.tsx
│   ├── app.config.ts
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── i18n/
│   │   ├── native/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── types/
│   │   └── utils/
│   └── modules/loud-ring/       Módulo nativo Android
├── worker/                      Relay Cloudflare Worker + D1
│   ├── src/index.ts
│   ├── schema.sql
│   └── wrangler.toml.example
├── PRIVACY.md
├── SECURITY.md
├── CHANGELOG.md
└── LICENSE
```

## Tecnologias

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript 6
- Expo Location / Task Manager / Battery / Network / SecureStore
- MapLibre React Native
- OpenStreetMap
- TweetNaCl `secretbox`
- Cloudflare Workers + D1
- GitHub REST API para releases públicas

## Requisitos de desenvolvimento

- Node.js 22.13 ou mais recente compatível com Expo SDK 57;
- npm;
- Android Studio + Android SDK;
- JDK 17;
- um aparelho Android real para testar background location de forma adequada;
- conta gratuita Cloudflare somente se você quiser o modo remoto; o plano gratuito tem cotas de uso e pode exigir ajuste do intervalo se você rastrear muitos aparelhos;
- GitHub CLI (`gh`) para publicar release pelo terminal.

> MapLibre e background location não funcionam plenamente no Expo Go. Use development build ou `expo run:android`.

## 1. Instalação

Na raiz:

```bash
npm install
```

Cheque o projeto:

```bash
cd apps/mobile
npx expo-doctor
```

## 2. Configurar o relay gratuito

O projeto foi dimensionado para uso pessoal. O Workers Free/D1 Free possui cotas diárias; com os intervalos padrão de ~10 s, poucos aparelhos ficam dentro do perfil pretendido, mas muitos canais simultâneos podem exigir aumentar os intervalos ou migrar de plano.

Entre na pasta:

```bash
cd worker
npm install
npx wrangler login
```

Crie o banco D1:

```bash
npx wrangler d1 create asterfind-db
```

Copie o `database_id` exibido e crie o arquivo real de configuração:

```bash
cp wrangler.toml.example wrangler.toml
```

No Windows PowerShell:

```powershell
Copy-Item wrangler.toml.example wrangler.toml
```

Edite `worker/wrangler.toml` e troque:

```toml
database_id = "COLE_AQUI_O_DATABASE_ID"
```

Crie as tabelas:

```bash
npm run db:migrate:remote
```

Publique:

```bash
npm run deploy
```

O terminal mostrará uma URL parecida com:

```text
https://asterfind-relay.seu-subdominio.workers.dev
```

Teste:

```text
https://asterfind-relay.seu-subdominio.workers.dev/health
```

## 3. Configurar o aplicativo

Copie o arquivo de ambiente:

```bash
cd ../apps/mobile
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha:

```env
EXPO_PUBLIC_RELAY_URL=https://asterfind-relay.seu-subdominio.workers.dev
EXPO_PUBLIC_PIX_KEY=SUA_CHAVE_PIX
```

O GitHub já está apontado para:

```text
https://github.com/RaphaelTW
```

O repositório esperado pelo verificador de versão é:

```text
RaphaelTW/asterfind
```

Se usar outro nome, altere `extra.githubRepo` em `apps/mobile/app.config.ts`.

## 4. Gerar o projeto Android nativo

```bash
npx expo prebuild --clean
```

O prebuild instala MapLibre e o módulo local `asterfind-loud-ring`.

## 5. Rodar no Android

Com o celular conectado por USB e depuração USB ativa:

```bash
npx expo run:android
```

Depois que o development build estiver instalado:

```bash
npx expo start --dev-client
```

## 6. Fluxo de pareamento de seus aparelhos

No aparelho principal:

1. Abra **Aparelhos**.
2. Digite um nome para o outro dispositivo.
3. Toque em **Gerar link de pareamento**.
4. Envie o link para o outro aparelho.

No aparelho rastreado:

1. Instale e abra o AsterFind.
2. Abra o link `asterfind://pair?...`.
3. Leia a mensagem de consentimento.
4. Toque em **Aceitar**.
5. Conceda localização precisa e localização em segundo plano.

O aparelho principal recebe os pacotes criptografados e passa a mostrar:

- mapa;
- coordenadas;
- endereço;
- precisão;
- bateria;
- estado ativo/inativo;
- última atualização;
- distância;
- botão para tocar.

## 7. Contatos: solicitar ou compartilhar localização

### Solicitar a localização de alguém

Na aba **Contatos** do aparelho solicitante:

1. abra **Solicitar localização**;
2. informe um nome para o contato;
3. toque em **Solicitar localização** e envie o link gerado;
4. o contato abre `asterfind://request?...` no AsterFind;
5. o AsterFind mostra a solicitação de forma visível, sem modo oculto;
6. o contato escolhe **1 hora, 8 horas, 1 dia, 7 dias ou Até eu desativar**;
7. somente depois de tocar em **Aceitar e compartilhar** o rastreamento em segundo plano é ativado.

A solicitação pendente expira em **7 dias** se não for aceita. Depois do aceite, a validade passa a ser exatamente a duração escolhida pelo contato.

O solicitante já possui apenas a credencial de leitura daquele canal. O contato recebe a credencial de publicação e define a validade ao aceitar. Esse tipo de canal **não** concede permissão para fazer o telefone do contato tocar.

### Compartilhar sua localização espontaneamente

Na mesma aba, em **Compartilhar minha localização**:

1. escolha a duração;
2. crie o convite;
3. envie o link à pessoa;
4. a pessoa precisa abrir o link no AsterFind e aceitar.

O convite de visualização possui somente permissão de leitura. Ele não recebe o token de comando para fazer seu telefone tocar.

## 8. Segurança do compartilhamento

Cada canal usa quatro valores diferentes:

- `channelId`: identificador público aleatório;
- `publisherToken`: autoriza publicar estado e ler comando;
- `viewerToken`: autoriza ler estado;
- `commandToken`: autoriza enviar comando;
- `key`: chave de 32 bytes usada no `secretbox`.

A chave `key` **nunca é enviada ao relay**.

Os tokens de autorização são convertidos para SHA‑256 antes de serem gravados no D1.

### Convite de contato

O link inclui:

- channel ID;
- viewer token;
- chave de criptografia;
- validade;
- nome do compartilhamento.

### Solicitação de localização

O solicitante cria o canal e mantém `viewerToken`, `commandToken` administrativo para poder apagar a própria solicitação e a chave do payload. O link enviado ao contato contém somente `publisherToken`, chave de criptografia, ID do canal e validade do convite. O canal pendente nasce com validade de 7 dias. Ao aceitar, o contato escolhe a duração e o relay substitui `expires_at` pela validade correspondente, que pode inclusive ser maior que os 7 dias do convite. O aplicativo do contato publica `shareExpiresAt` dentro do payload criptografado para que o solicitante atualize a validade exibida localmente.

O `commandToken` desse fluxo é usado apenas para apagar a solicitação criada pelo próprio solicitante; a interface marca o canal com `canRing: false`, portanto não existe comando de toque para contatos.

### Convite de pareamento

O link enviado ao aparelho rastreado inclui:

- channel ID;
- publisher token;
- chave de criptografia;
- validade;
- nome do aparelho.

O `commandToken` fica somente no aparelho controlador.

## 9. Privacidade e transparência

O AsterFind não implementa:

- rastreamento secreto;
- instalação escondida;
- remoção do ícone;
- compartilhamento sem aceite;
- gravação de áudio;
- leitura de mensagens;
- câmera remota;
- acesso a arquivos pessoais.

No Android, localização em segundo plano utiliza uma notificação persistente. Isso é intencional.

## 10. Mapas e endereço sem chave

O projeto usa MapLibre com tiles raster do OpenStreetMap. Para projeto pessoal e testes leves isso evita uma chave de API. Sempre mantenha a atribuição `© OpenStreetMap contributors`.

Para uma aplicação pública com muitos usuários, recomenda-se hospedar seus próprios tiles ou usar um provedor adequado, pois o servidor público do OpenStreetMap possui política de uso e não deve ser tratado como CDN ilimitada.

A geocodificação reversa é feita com `Location.reverseGeocodeAsync`, que usa o serviço de geocodificação do próprio sistema operacional. Assim não é necessário Nominatim no aplicativo.

## 11. Atualização por GitHub Release

O app consulta no máximo uma vez por dia automaticamente (ou imediatamente quando o usuário toca em verificar), quando ativado em Configurações:

```text
GET /repos/RaphaelTW/asterfind/releases/latest
```

Repositórios públicos podem usar esse endpoint sem autenticação. O app procura primeiro um asset `.apk`; se não houver, abre a página da release.

O sistema **não instala APK silenciosamente**. O Android exige a confirmação do usuário para instalação fora da Play Store.

## 12. Alterar versão

Altere em:

```text
apps/mobile/app.config.ts
apps/mobile/package.json
```

Exemplo:

```text
1.0.0 -> 1.0.1
```

## 13. Build APK local

Depois do `prebuild`:

### Windows

```powershell
cd android
.\gradlew.bat assembleRelease
```

### Linux/macOS

```bash
cd android
./gradlew assembleRelease
```

Saída típica:

```text
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Para distribuição real, configure uma keystore própria e não publique a chave privada no repositório.

## 14. Primeiro commit profissional

Na raiz do projeto:

```bash
git init
git add .
git commit -m "feat: initialize AsterFind v1.0.0 with consent-based device tracking"
git branch -M main
git remote add origin https://github.com/RaphaelTW/asterfind.git
git push -u origin main
```

## 15. Tag da primeira versão

```bash
git tag -a v1.0.0 -m "AsterFind v1.0.0"
git push origin v1.0.0
```

## 16. Release v1.0.0 com GitHub CLI

Se o APK já estiver compilado:

```bash
gh release create v1.0.0 \
  apps/mobile/android/app/build/outputs/apk/release/app-release.apk \
  --title "AsterFind v1.0.0" \
  --notes-file RELEASE-v1.0.0.md
```

No PowerShell:

```powershell
gh release create v1.0.0 `
  "apps/mobile/android/app/build/outputs/apk/release/app-release.apk" `
  --title "AsterFind v1.0.0" `
  --notes-file "RELEASE-v1.0.0.md"
```

## 17. Convenção de commits

Sugestão:

```text
feat:     novo recurso
fix:      correção
security: melhoria de segurança
perf:     desempenho
refactor: refatoração
style:    mudança visual
build:    build/dependências
ci:       automação
chore:    manutenção
docs:     documentação
```

## 18. Permissões Android

O app pede somente o que os recursos principais precisam:

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`
- `VIBRATE`
- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `ACCESS_NOTIFICATION_POLICY` no módulo nativo para abrir/consultar a configuração de Não Perturbe

## 19. Testes recomendados

Teste em pelo menos dois aparelhos físicos e redes diferentes:

- Wi‑Fi -> Wi‑Fi;
- Wi‑Fi -> 4G/5G;
- 4G/5G -> 4G/5G;
- tela apagada por 30 minutos;
- economia de bateria ativa;
- modo avião;
- aparelho sem internet;
- app removido dos recentes;
- app forçado a parar;
- silencioso;
- Não Perturbe;
- compartilhamento expirado;
- compartilhamento revogado;
- nova release no GitHub.

Em aparelhos Samsung, também valide as configurações de bateria em **Configurações > Assistência do aparelho e bateria > Bateria > Limites de uso em segundo plano**.

## 20. Licença

**Apache License 2.0**.

Ela permite uso, modificação, distribuição e uso comercial, mantendo os avisos de licença e oferecendo uma cláusula explícita de patente.

Veja `LICENSE`.

## Aviso

Este projeto não é afiliado, patrocinado ou endossado pela Samsung, Google, OpenStreetMap Foundation ou Cloudflare. Samsung Find, Google Find Hub/Localizador, One UI e demais marcas pertencem aos respectivos titulares.
