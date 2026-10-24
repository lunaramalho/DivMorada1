# DivMorada

Aplicativo React Native para dividir despesas entre moradores de uma casa, desenvolvido para o TCC. Inclui cadastro, convites, despesas compartilhadas, pagamentos com comprovantes, histórico individual e cobranças por e-mail.

## Tecnologias e requisitos

| Tecnologia | Versão do projeto |
| --- | --- |
| Expo | SDK 58 |
| React Native | 0.88 |
| React | 19.3 |
| Expo Router | 58 |
| TypeScript | 6 |
| Supabase | Auth, PostgreSQL, Storage e Edge Functions |
| Resend | Envio de cobranças |

Instale [Git](https://git-scm.com/downloads) e [Node.js 24 LTS](https://nodejs.org/) com npm. A versão utilizada foi **24.17.0**, registrada em `.nvmrc`. O Expo 58 exige Node compatível com `^22.13.0`, `^24.3.0` ou `^26.0.0`.

Para testar no celular, instale Expo Go compatível com **SDK 58**. O aplicativo foi testado no iPhone com Expo Go 58.0.5. Crie uma conta gratuita em [expo.dev](https://expo.dev/signup); no iPhone físico, a conta Expo deve ser a mesma no computador e no Expo Go. Essa conta é diferente do login do DivMorada.

Android Studio e Xcode não são necessários para testar pelo Expo Go. Gerar um aplicativo iOS próprio é outro processo, com requisitos de build específicos.

## 1. Baixar o código no outro computador

```powershell
git clone https://github.com/lunaramalho/DivMorada1.git
cd DivMorada1
node --version
npm --version
npm ci
```

As dependências são instaladas automaticamente a partir de `package-lock.json`. Não é necessário instalar React Native, Expo e cada biblioteca manualmente. O `.npmrc` mantém `legacy-peer-deps=true`, opção usada na instalação validada do projeto.

Em uma cópia já existente, guarde suas alterações locais antes de executar `git pull --ff-only` e `npm ci`. Não atualize dependências nem execute `npm audit fix --force` antes da apresentação sem repetir os testes.

## 2. Configurar o ambiente

Crie o arquivo local:

```powershell
Copy-Item .env.example .env
```

No macOS/Linux, use `cp .env.example .env`.

Preencha com os valores do seu projeto Supabase:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

Obtenha esses valores nas configurações de API do painel Supabase. Use a chave pública de cliente `anon` compatível com o projeto. **Nunca use `service_role`, chave secreta do Supabase ou chave Resend no aplicativo.**

O `.env` não é versionado. Configure-o no outro computador usando os valores corretos, sem publicá-los em commits. Reinicie o Expo se alterar as variáveis.

Para apresentar os dados já cadastrados, utilize **o mesmo projeto Supabase do desenvolvimento**. Mudar de PC não exige recriar o banco, reaplicar migrações ou copiar segredos de servidor. Os dados e a função de cobrança continuam na nuvem.

O aplicativo acessa diretamente o Supabase: **não existe uma API local obrigatória na porta 5000**, e a antiga variável `EXPO_PUBLIC_API_URL` não é utilizada.

## 3. Rodar na web

```powershell
npm run web
```

Abra `http://localhost:8081`. Se a CLI escolher outra porta, use o endereço informado e revise as configurações dependentes da origem web.

## 4. Rodar no iPhone ou Android

Entre na conta Expo no computador:

```powershell
npx expo login
npx expo whoami
```

No Expo Go do iPhone, entre na **mesma conta**.

### Mesma rede Wi-Fi

```powershell
npm start
```

Leia o QR code pela câmera do iPhone e aceite abrir no Expo Go. No Android, use o leitor do Expo Go.

### Redes diferentes ou conexão local restrita

```powershell
npm run start:tunnel
```

Leia o **novo QR code exibido nesse terminal**. Não reutilize uma captura de outro computador ou de um túnel encerrado. Aguarde a primeira compilação. O Expo 58 utiliza seu túnel gerenciado; não é necessário iniciar um túnel separado para a API.

Mantenha o computador ligado, o terminal executando e a internet disponível. Se precisar mudar de porta:

```powershell
npx expo start --tunnel --port 8082
```

Uma rede institucional pode bloquear o túnel mesmo com acesso à internet. Faça um ensaio no computador e na rede reais do local. Se utilizar rede móvel como alternativa, teste antes. O aplicativo depende de acesso ao Supabase e, para cobranças, ao Resend por meio da função no servidor.

## 5. Recuperação de senha

Em **Esqueci minha senha**, o usuário solicita um link enviado pelo Supabase. A nova senha deve ter pelo menos oito caracteres e coincidir com a confirmação.

No painel Supabase, em **Authentication → URL Configuration → Redirect URLs**, autorize os retornos exatos utilizados:

| Ambiente | Endereço de retorno |
| --- | --- |
| Web local | `http://localhost:8081/reset-password` |
| Aplicativo instalado com scheme próprio | `divmorada://reset-password` |
| Expo Go | Endereço do servidor/túnel atual terminado em `/--/reset-password` |

No celular, o código usa `Linking.createURL('reset-password')`. No Expo Go será `exp://.../--/reset-password` ou `exps://.../--/reset-password`, conforme o servidor. O protocolo e o endereço precisam corresponder ao retorno autorizado.

**Ao trocar de PC ou reiniciar o túnel, confira novamente essa configuração.** O endereço do túnel é temporário; não copie um endereço antigo da documentação como configuração permanente.

Configure também o **Site URL** para o endereço padrão adequado ao ambiente. Se um retorno não estiver autorizado, o Supabase pode redirecionar para o Site URL. `localhost` aberto no iPhone aponta para o próprio iPhone, não para o computador.

Para o TCC, a recuperação usa o envio padrão do Supabase, separado do Resend das cobranças. Esse envio tem restrições de destinatários da equipe e limite baixo de e-mails; confira a [documentação oficial](https://supabase.com/docs/guides/auth/auth-smtp). Um usuário comum fora dos destinatários permitidos pode não receber o e-mail. Para oferecer recuperação a qualquer usuário, configure SMTP próprio posteriormente.

O retorno nativo é tratado por `app/+native-intent.tsx` antes da normalização da navegação. Não publique links de recuperação, tokens ou senhas. Detalhes em [recuperação de senha](docs/recuperacao-senha.md).

## 6. Banco novo — somente se necessário

**Pule esta seção se for usar o projeto Supabase já configurado.** Instalar o aplicativo em outro computador não exige executar SQL novamente.

Para um projeto Supabase novo:

1. Crie o projeto no Supabase.
2. Revise e execute `supabase-schema.sql` no SQL Editor.
3. Depois, aplique **uma única vez** `supabase/migrations/202610240001_charge_email.sql`. A migração restringe permissões e cria o controle de cobranças.
4. Não execute o esquema base novamente após migrar, pois ele contém políticas antigas e permissivas.
5. Confira o bucket `comprovantes` e as políticas de Storage criadas pelo esquema. Comprovantes usam o prefixo `comprovantes/`; fotos de perfil usam `avatares/<usuario>/`.
6. Configure as URLs de autenticação e a função de cobrança, se utilizada.

O bucket atual é público. Antes de disponibilizar dados pessoais fora do contexto de demonstração, revise os requisitos de privacidade e o modelo de acesso aos arquivos.

## 7. Cobranças com Resend

Recebíveis envia lembretes pela Edge Function **send-charge-email**. Somente o credor autorizado pode solicitar envio de uma parcela pendente, com confirmação e intervalo de 24 horas após aceitação. A aceitação pelo serviço não comprova entrega na caixa de entrada.

Com o backend existente, a função e seus segredos já ficam no Supabase: **não coloque chave Resend no `.env` do novo PC**.

Para configurar um backend novo:

1. Crie uma conta Resend e verifique um domínio/subdomínio com os registros DNS fornecidos pelo Resend.
2. Crie uma chave restrita a envio pelo domínio escolhido.
3. Publique `supabase/functions/send-charge-email` pelo painel Supabase ou pela CLI Supabase instalada:

```powershell
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy send-charge-email
```

4. Em **Edge Functions → Secrets**, configure:

| Segredo | Valor/uso |
| --- | --- |
| `RESEND_API_KEY` | Chave restrita de envio, apenas no servidor |
| `CHARGE_EMAIL_FROM` | Exemplo: `DivMorada <cobrancas@avisos.seu-dominio.com.br>` |
| `CHARGE_ALLOWED_ORIGINS` | `http://localhost:8081`; outras origens web separadas por vírgula |

O remetente deve pertencer ao domínio verificado. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos pelo runtime Supabase; não os copie para o cliente. Mantenha a verificação JWT habilitada em `supabase/config.toml`.

Se usar a versão web pelo endereço público do túnel, inclua essa origem em `CHARGE_ALLOWED_ORIGINS`. As requisições nativas continuam autenticadas por token.

Consulte [configuração das cobranças](docs/cobrancas-email.md) para implantação, permissões, limites e tratamento de falhas.

## 8. Conferir a instalação

```powershell
npm run typecheck
npm run lint
npm test
npm run test:email
npx expo install --check
npx expo-doctor@latest
```

Os testes locais não enviam e-mails nem confirmam pagamentos reais. A suíte de cobrança usa Postgres embarcado via PGlite, sem alterar o banco remoto.

Para verificar os pacotes sem publicar:

```powershell
npx expo export --platform ios --platform web --output-dir dist
```

Isso gera os bundles e a versão web; não gera um IPA instalado nem substitui o teste no aparelho.

## 9. Roteiro da apresentação

1. Iniciar o servidor/túnel no PC e abrir o novo QR code no Expo Go.
2. Entrar e mostrar os saldos do Início.
3. Mostrar moradores, administrador e convite da casa.
4. Simular a divisão de uma despesa e cancelar, ou salvar um teste previamente escolhido.
5. Demonstrar Dívidas, Recebíveis e comprovantes usando somente parcelas combinadas.
6. Abrir o histórico e filtrar o período.
7. Para cobrança, combinar destinatário e parcela; respeitar o intervalo de envio.
8. Para recuperação de senha, conferir o retorno do novo túnel e o limite de e-mails antes da apresentação.

Web e celular usam o mesmo backend: criar casa, confirmar pagamento e enviar cobrança produzem efeitos reais no projeto configurado.

Veja a [revisão dos testes do TCC](docs/revisao-tcc.md) e a [atualização para SDK 58](docs/atualizacao-sdk58.md).

## Estrutura

```text
app/                     Rotas e telas Expo Router
src/features/            Componentes e hooks por funcionalidade
src/components/          Componentes compartilhados
src/services/            Supabase, sessão e serviços
supabase/functions/      Função de cobrança e template de e-mail
supabase/migrations/     Permissões e controle de envio
tests/                   Testes locais
docs/                    Configuração, decisões e revisão do TCC
```
