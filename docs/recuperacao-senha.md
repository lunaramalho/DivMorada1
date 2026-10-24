# Recuperação de senha — preparação local

Estado: código implementado. O usuário confirmou que conseguiu redefinir a senha e decidiu manter o envio padrão do Supabase para o TCC, sem ativar SMTP Resend no Auth. Os valores abaixo são uma proposta anterior, não configurações aplicadas por esta tarefa. Cobranças continuam com Resend.

## Fluxo

Login → Esqueci minha senha → e-mail → link do Supabase → Redefinir senha → confirmação → Voltar ao login.

A solicitação mostra a mesma mensagem para contas existentes e inexistentes. A nova senha tem mínimo de oito caracteres e deve coincidir com a confirmação. Link ausente ou inválido não exibe o formulário. A sessão retornada pelo Supabase é validada antes da atualização. A recuperação usa o fluxo implícito atual do cliente e consome explicitamente os tokens; `detectSessionInUrl` continua desativado. Tokens são removidos da URL web após a leitura, sem gravá-los em logs ou no código. Recarregar a página após essa limpeza exige um novo link.

## Valores para revisar no Supabase DivMorada2

- Site URL atual: `http://localhost:3000`; proposto: `http://localhost:8081`.
- Redirect URLs atuais: nenhuma. Adicionar exatamente `http://localhost:8081/reset-password` e `divmorada://reset-password`.
- Custom SMTP atual: desativado.
- Remetente: `acesso@avisos.divmorada.com.br`; nome: `DivMorada`.
- Host SMTP: `smtp.resend.com`; porta: `465`; usuário: `resend`.
- Senha SMTP: nova chave Resend, somente envio pelo domínio `avisos.divmorada.com.br`, criada exclusivamente para Supabase Auth. Transferir diretamente entre painéis, sem inserir no chat, no repositório ou em variáveis públicas.

Ativar SMTP altera o provedor de TODOS os e-mails do Supabase Auth, incluindo cadastro, além da recuperação. Não altera a Edge Function de cobranças.

## Teste real pendente

Em 24/10/2026, com autorização explícita, foram salvos somente os retornos `exp://c-lunaramalho-575wtl-mvmttaf3r1vjv8oc.on.expo.app/--/reset-password` e `exps://c-lunaramalho-575wtl-mvmttaf3r1vjv8oc.on.expo.app/--/reset-password` para teste no iPhone pelo túnel SDK 58. Confirmação do painel: “Successfully added 2 URLs”. Site URL permanece `http://localhost:3000`; SMTP não foi alterado. O código usa `Linking.createURL` para escolher o retorno adequado ao Expo Go ou aplicativo instalado. A leitura nativa usa o link mais recente do Expo Linking, inclusive ao voltar do e-mail com o aplicativo já aberto. Reteste no iPhone pendente; se o túnel mudar, revisar esses retornos.

O reteste mostrou navegação correta, mas dados de recuperação ausentes. A inspeção de `expo-router/build/fork/extractPathFromURL.js` identificou que a normalização nativa descarta o fragmento. Adicionado `app/+native-intent.tsx` para capturá-lo antes disso e passar à tela apenas um identificador de tentativa. Tokens ficam somente em memória por no máximo cinco minutos, são consumidos uma vez e validados pelo Supabase. Os testes cobrem captura antes da perda do fragmento, link com tela já aberta, expiração e descarte de tentativas inválidas.

Em 24/10/2026, o usuário confirmou no iPhone que conseguiu redefinir a senha pelo link e entrar com a nova senha. Fluxo completo validado pelo usuário, com envio padrão do Supabase e retorno ao Expo Go. Nenhuma senha foi solicitada ou registrada nesta documentação.

Após revisar e aplicar as configurações, escolher explicitamente um e-mail de teste cadastrado. Solicitar apenas um link, conferir o envio no Resend e abrir no mesmo computador do servidor local. A pessoa deve digitar e confirmar a própria nova senha. Conferir sucesso, retorno ao login e login com a nova senha. Verificar também link expirado e reuso.

O endereço localhost não funciona no e-mail aberto em outro aparelho. O retorno `divmorada://reset-password` exige development build ou aplicativo instalado com esse scheme; não está validado no Expo Go nem em dispositivo real. Ao publicar a web, adicionar a URL HTTPS real de retorno e revisar o Site URL.

## Referências

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-supabase-smtp
