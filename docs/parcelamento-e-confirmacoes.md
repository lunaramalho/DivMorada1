# Parcelamento e confirmações

Especificação aprovada durante a conversa. Reúne o pedido de interface e as regras confirmadas.

## Fluxo definido

- Em Dívidas a Pagar, cada card elegível terá um menu discreto de três pontos verticais próximo ao valor, preservando o design, a responsividade e os botões Pagar Agora e Anexar Comprovante.
- Somente um menu ficará aberto; clicar fora o fechará. Dívidas quitadas ou com solicitação de parcelamento pendente não oferecerão Solicitar parcelamento.
- Solicitar parcelamento abrirá um modal com credor, total, quantidade de parcelas e cálculo automático dos respectivos valores.
- Enviar solicitação encaminhará o pedido ao credor. Somente sua aprovação produzirá as parcelas, com vencimentos e pagamento individual, substituindo visualmente a dívida original e preservando o total e o histórico, sem duplicar valores. A recusa preservará a dívida.
- O Início terá acesso à página Confirmações, que reunirá solicitações de parcelamento e pagamentos informados pelo devedor para análise do credor, incluindo consulta ao comprovante anexado.
- Quem Me Deve continuará permitindo ao credor registrar diretamente um recebimento quando o devedor esquecer de informar o pagamento.
- Ao informar um pagamento, a dívida ficará como Aguardando confirmação e continuará contabilizada no saldo até o credor confirmar o recebimento.
- Se o credor recusar o pagamento informado, o devedor poderá enviar o comprovante novamente. A recusa não quitará nem removerá o valor do saldo.
- O comprovante será opcional ao informar um pagamento. A página Confirmações permitirá ao credor confirmar ou recusar o recebimento com ou sem anexo. Após uma recusa, o devedor poderá informar o pagamento novamente, também com ou sem comprovante.
- O devedor escolherá a data da primeira parcela no modal. As demais vencerão no mesmo dia dos meses seguintes, ajustando para o último dia do mês quando o dia escolhido não existir. O credor verá todas as datas e valores antes de aprovar.
- O parcelamento terá entre 2 e 12 parcelas, sem juros e com valor mínimo de R$ 0,01 por parcela. Os centavos restantes serão distribuídos nas primeiras parcelas, preservando exatamente o total. Exemplo: R$ 100,00 em três parcelas de R$ 33,34, R$ 33,33 e R$ 33,33.
- Enquanto um pagamento informado ou uma solicitação de parcelamento aguardar análise, a dívida bloqueará novas solicitações de parcelamento e novos registros de pagamento pelo devedor.
- O credor continuará podendo marcar o recebimento diretamente em Quem Me Deve durante uma análise pendente. Esse recebimento encerrará automaticamente a solicitação pendente, sem gerar parcelas nem contabilizar o pagamento duas vezes.
- Somente a dívida original poderá ser parcelada; as parcelas criadas após aprovação não poderão ser parceladas novamente. Se o credor recusar uma proposta, o devedor poderá enviar uma nova proposta para a dívida original.
- O devedor poderá cancelar pagamentos informados e pedidos de parcelamento enquanto aguardarem análise, liberando a dívida sem alterar o saldo. Após aprovação, não haverá cancelamento por esse fluxo.

## Mudança em relação ao fluxo anterior

Antes, Pagar Agora em Dívidas a Pagar confirmava diretamente o pagamento. Agora, envia um pagamento informado para análise do credor. Pagamentos já confirmados antes dessa mudança permanecem confirmados.

## Ativação no Supabase

A interface depende de `supabase/migrations/202611080001_payment_requests.sql`, aplicada uma única vez **após** `202610240001_charge_email.sql`, no projeto Supabase utilizado pelo aplicativo. O usuário confirmou a execução no SQL Editor com o resultado “Success. No rows returned”. Não executar novamente no mesmo banco.

Ela adiciona a tabela de solicitações, os vínculos e vencimentos de parcelas e as funções transacionais. Revoga atualizações diretas de pagamentos pelo cliente para que versões antigas não consigam quitar uma dívida sem confirmação do credor. Não apaga dívidas existentes nem reaplica o esquema base.

Para aplicar pelo painel, abrir o SQL Editor do projeto correto, revisar e executar o conteúdo completo da nova migração, incluindo BEGIN/COMMIT. Não executar novamente `supabase-schema.sql` nem a migração anterior. Recarregar o aplicativo após a aplicação.

## Validação

- `npm run typecheck` e `npm run lint`.
- `npm test`: inclui cálculos/calendário e testes das funções e permissões com PostgreSQL embarcado (PGlite), sem tocar o banco remoto.
- `npm run test:email`: regressão do fluxo existente de cobranças.
- As rotas `/`, `/debtors` e `/confirmations` compilaram e responderam HTTP 200 no Expo.
- Conferência visual web/mobile e teste completo com duas contas no Supabase continuam pendentes. Não foram informados pagamentos nem enviados pedidos reais durante os testes.

## Ensaio com duas contas após a migração

1. Na conta devedora, abrir o menu de uma dívida original, conferir as parcelas e enviar uma proposta. Conferir o total do saldo e o bloqueio dos botões enquanto pendente.
2. Na conta credora, abrir Início → Confirmações → Parcelamentos e conferir todos os valores e vencimentos antes de aprovar ou recusar.
3. Após aprovação, conferir a substituição da dívida pelas parcelas em ambas as contas e a preservação do total.
4. Informar pagamento de uma parcela sem anexo; conferir que continua no saldo. Recusar pelo credor, reenviar com comprovante opcional e confirmar o recebimento.
5. Conferir que somente a parcela confirmada sai do saldo e entra no histórico, com o comprovante quando anexado.
6. Cancelar um pedido ainda pendente e conferir a liberação da dívida. Repetir com recebimento direto em Quem Me Deve e conferir que o pedido é encerrado sem criar parcelas.

## Decisões técnicas

Veja [preservação da dívida original e confirmação pelo credor](adr/0002-parcelamento-e-confirmacao.md).
