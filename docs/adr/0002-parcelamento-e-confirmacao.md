# Preservar a dívida original e confirmar recebimentos no servidor

A dívida permanece PENDENTE e no saldo enquanto uma solicitação separada aguarda análise; somente o credor confirma o recebimento. Na aprovação do parcelamento, preservamos a dívida original como CANCELADA e criamos pagamentos filhos vinculados a ela na mesma transação, em vez de apagar ou alterar seu valor: isso mantém o histórico e exclui a original dos saldos sem duplicar valores.

Criação, cancelamento, análise e recebimento direto passam por funções no banco com identidade validada, bloqueio da dívida e no máximo uma solicitação pendente por pagamento. A criação das parcelas e o encerramento da solicitação são atômicos; repetir uma aprovação não gera novas parcelas. Escritas diretas de status e comprovantes pelo cliente são revogadas para que uma versão antiga do aplicativo não consiga quitar uma dívida sem o credor.
