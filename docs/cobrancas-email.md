# Cobranças por e-mail

## Comportamento

O botão de Recebíveis pede confirmação e chama `send-charge-email` apenas com `pagamentoId`. A função autentica a sessão, busca o destinatário no Supabase Auth e exige e-mail confirmado, credor correspondente, parcela pendente e vínculos ativos na mesma casa. A chave Resend nunca entra no aplicativo.

A reserva no banco impede envios concorrentes. Após aceitação, a parcela fica bloqueada por 24 horas. Falhas ou timeouts reutilizam o mesmo identificador e o mesmo conteúdo no Resend; após 23 horas sem reconciliação, a tentativa exige inspeção manual para não ultrapassar a validade da idempotência do provedor. Não apagar reservas pendentes para tentar novamente.

Uma aceitação registra data, identificador Resend e histórico atomicamente. Não significa entrega na caixa de entrada. Não há webhook nesta versão.

## Arquivos e publicação

1. Conferir e guardar um snapshot das políticas e permissões do banco publicado. A migração substitui políticas permissivas e restringe alterações de dados financeiros. Rever especialmente casas legadas sem dono ativo. O autor que registrou despesas antigas é preenchido com o credor porque o esquema anterior não guardava essa informação.
2. Aplicar `supabase/migrations/202610240001_charge_email.sql` uma única vez, em transação. Em instalações novas, executar primeiro o esquema base e depois a migração; não executar novamente as políticas permissivas do esquema base após migrar.
3. Publicar `supabase/functions/send-charge-email` com a verificação de JWT habilitada e configurar os segredos abaixo.
4. Publicar o aplicativo junto da migração: a entrada por convite agora usa `join_house_by_code`, que valida o código e cria o vínculo atomicamente. As chaves da casa e o credor da despesa não podem ser reescritos pelo cliente.
5. Testar com um destinatário autorizado, verificar a aceitação no Resend e testar novo clique dentro de 24 horas. Não enviar testes para moradores sem autorização.

Os registros de histórico antigos “Cobranca enviada” vieram da implementação anterior, que não enviava e-mails. Eles não comprovam entrega e não são usados para limitar novos envios.

## Segredos da Edge Function

- `RESEND_API_KEY`: chave restrita a envio pelo subdomínio verificado.
- `CHARGE_EMAIL_FROM`: `DivMorada <cobrancas@avisos.divmorada.com.br>`.
- `CHARGE_ALLOWED_ORIGINS`: origens web permitidas, separadas por vírgula, por exemplo `http://localhost:8081`. Incluir a origem da versão publicada quando existir. Requisições nativas sem Origin continuam autenticadas por JWT.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: fornecidos pelo runtime Supabase; não copiar para o aplicativo.

Não usar prefixo EXPO_PUBLIC para segredos. Não colar chaves no chat ou versionar arquivos com chaves.

## DNS no Registro.br

Subdomínio aprovado: `avisos.divmorada.com.br`. Usar os valores da página Domains do Resend; não copiar exemplos de outros projetos.

Na configuração atual, o Resend gerou TXT `resend._domainkey.avisos` e CNAME `rsend.avisos` e `send.avisos`. O recebimento está desativado. O TXT é uma chave pública DKIM; a chave privada permanece com o provedor. Não foi criado Reply-To nem caixa de entrada. O rodapé informa que o e-mail é automático e não deve ser respondido.

## Validação local

- `npm run test:email`: banco Postgres embarcado via PGlite; testa permissões, isolamento, convites, imutabilidade, concorrência, reenvio, intervalo, histórico idempotente e escape HTML. Não conecta ao banco real nem envia e-mail.
- `npx tsc --noEmit` e `npm run lint`: aplicativo.
- `deno check --no-config supabase/functions/send-charge-email/index.ts`: runtime da função, separado do TypeScript do Expo.

## Limitações operacionais

Não há transação distribuída entre banco e Resend: se o provedor aceitar e a gravação falhar, o cliente recebe uma orientação de reconciliação e pode repetir com a mesma chave. Se uma parcela for quitada depois de reservada mas antes do processamento externo, o lembrete pode chegar com dados do momento da reserva. O texto orienta conferir o registro caso já tenha pago.

As políticas de Storage existentes não foram ampliadas nem revistas por esta integração. A migração limita as tabelas utilizadas pela cobrança, mas não substitui uma revisão geral do produto.

## Estado da implantação em 24/10/2026

Migração aplicada ao projeto existente e função publicada com verificação JWT. O subdomínio avisos.divmorada.com.br está verificado no Resend, com chave restrita armazenada exclusivamente como segredo no Supabase. A origem web configurada é http://localhost:8081.

O teste autorizado de uma parcela de R$ 1,00 registrou a aceitação no Resend e no histórico do aplicativo. O destinatário confirmou o recebimento na caixa de entrada. O envio pelo iPhone também foi confirmado pelo usuário. Esses testes manuais não substituem acompanhamento de entrega por webhook.

Ao trocar de computador, basta configurar o cliente conforme o README. Não reaplicar a migração nem recriar chaves para utilizar o mesmo backend.
