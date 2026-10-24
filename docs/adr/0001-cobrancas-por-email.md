# Cobranças manuais por e-mail com Resend

O envio de cobranças será solicitado por parcela pendente e executado por uma Supabase Edge Function usando a API do Resend. A chave permanece como segredo do servidor, que valida a identidade do credor, os vínculos com a casa e os dados da parcela; as permissões do banco serão revisadas antes de liberar o envio.

O remetente aprovado é `DivMorada <cobrancas@avisos.divmorada.com.br>`, com verificação DNS do subdomínio no Registro.br. Não haverá encaminhamento de respostas ao credor. O lembrete conterá casa, despesa, valor da parcela e credor, sem Pix ou link de pagamento.

O usuário confirma cada envio, limitado a um envio por parcela a cada 24 horas. A interface só informa sucesso após o Resend aceitar a solicitação; isso não representa confirmação de entrega na caixa de entrada.
