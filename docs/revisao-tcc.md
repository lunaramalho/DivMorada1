# Revisão para apresentação do TCC — 24/10/2026

Ambiente: Expo web local, visualização de celular, conta Lunna na Casa Luna. Esta revisão não publicou alterações externas, não criou despesas, não confirmou pagamentos, não removeu moradores e não enviou cobranças ou recuperação de senha.

## Conferido nesta revisão

| Tela/fluxo | Resultado e alcance |
| --- | --- |
| Início | Saldo -R$ 94,66; a pagar R$ 134,33; a receber R$ 39,67. Atividades e navegação carregam. |
| Casa | Três moradores, administrador identificado, avatares e código visíveis. Membro comum deixa de ver ações administrativas. |
| Nova despesa | Formulário, seleção e divisão: R$ 3,00 / 3 = R$ 1,00. Cancelamento descarta a revisão sem salvar. |
| Dívidas | Parcelas de R$ 1,00 e R$ 133,33 carregadas. Modal de revisão abre; cancelar não confirma pagamento. |
| Recebíveis | R$ 1,00 + R$ 1,00 + R$ 1,00 + R$ 36,67. Sessão e registros preservados ao recarregar. Não acionados recebimento ou envio real. |
| Perfil | Dados, modalidade de morador e acesso ao histórico carregados. Não alteradas foto, nome ou senha. |
| Histórico | Total pago R$ 1,00 e recebido R$ 1,00. Data final 23/10 remove ambos; 31/10 restaura. Comprovante de imagem abre e fecha. |
| Voltar após recarga | Corrigido e conferido retorno de Recebíveis ao Início quando não existe histórico interno de navegação. |

## Correções realizadas

- Restauração da sessão armazenada, validada pelo Supabase, antes de renderizar as telas; erro de rede oferece nova tentativa.
- Quebra de linha nas atividades recentes para não ultrapassar a largura do celular.
- Ações de administrar moradores exibidas apenas para administrador ativo; o próprio administrador não recebe ação de remoção. As permissões do banco permanecem como estavam.
- Falha de cópia do convite agora mostra orientação, em vez de falso sucesso ou erro sem tratamento.
- Formulário de troca de senha do Perfil encaminha a senha atual ao Supabase Auth. Confirmado por teste com cliente simulado, sem mudar credenciais reais.
- Criação de casa usa diretamente o registro retornado pela criação, evitando escolher outra casa com nome igual.
- Botões Voltar de telas financeiras/Perfil/histórico têm destino alternativo quando não existe rota anterior; links Entrar e Voltar ao login levam diretamente ao login.

## Verificações de código

TypeScript, lint e geração estática da versão web (22 rotas) aprovados. Onze testes de alertas, sessão e recuperação aprovados, além da suíte de e-mail com banco local simulado: políticas, convite, dados imutáveis, credor, concorrência, intervalo de envio e histórico idempotente.

## Evidências de etapas anteriores

Login inválido, cadastro com senhas diferentes e e-mail duplicado foram testados na web. Saída de conta e persistência após recarregar foram testadas antes da mudança de restauração; a restauração também possui testes para sessão ausente e revogada. Despesas de teste foram salvas; uma parcela paga e outra recebida saíram das listas e atualizaram o painel. Cobrança real apareceu no Resend e no histórico, com recebimento confirmado pelo usuário. O usuário confirmou a recuperação de senha pelo envio padrão do Supabase.

## Limites e ensaio final

- Login válido/saída não foram repetidos nesta revisão para preservar a sessão do ensaio. Troca real de senha e foto, criação/entrada de casa, remoção de morador e novas gravações financeiras não foram repetidas.
- PDF e dispositivo Android/iOS instalado não foram testados. A verificação visual desta revisão foi na web com largura de celular.
- Recuperação permanece com envio padrão do Supabase, conforme decisão do usuário; não ativar SMTP Resend para Auth nesta etapa. Cobranças continuam com Resend. As limitações de envio padrão devem ser consideradas antes de repetir a recuperação durante a apresentação.
- A aplicação depende de internet para Supabase e Resend. Fazer um ensaio no computador e na rede reais do local. Localhost aberto em outro aparelho aponta para esse aparelho, não para o servidor do computador.
- Comprovantes continuam em bucket público, conforme configuração existente; não houve mudança de privacidade nesta revisão.

Roteiro sugerido: entrar → Início → Casa → simular divisão de despesa e cancelar → Dívidas e modal/cancelar → Recebíveis → Perfil → histórico/filtro/comprovante. Usar somente os registros explicitamente escolhidos para testes que alterem dados.

## Reteste no iPhone após atualização para SDK 58

Resultados confirmados pelo usuário em 24/10/2026 no Expo Go:

- Todas as páginas abriram.
- Foto selecionada novamente aparece no Perfil e em Casa sem o erro de URL blob.
- Divisão de R$ 3,00: R$ 1,00 para três participantes e R$ 1,50 para dois; cancelar voltou à Casa sem salvar.
- Comprovante: anexar, abrir, trocar, remover e cancelar funcionaram sem confirmar a parcela.
- Parcela de teste de R$ 1,00 paga: saiu da lista, reduziu o valor devido e apareceu no histórico com comprovante.
- Recebimento de teste de R$ 1,00: cancelar preservou a parcela; confirmar removeu da lista, atualizou o saldo e registrou em Recebi.
- Cobrança enviada pelo iPhone chegou ao e-mail, segundo o usuário.
- Sair, erro de senha incorreta, novo login e persistência da sessão após fechar e abrir funcionaram.
- Recuperação pelo link no iPhone: após corrigir a captura nativa antes da normalização do Router, o usuário redefiniu a senha e entrou com a nova senha.

O usuário confirmou também o cadastro de uma nova conta, login e criação da Casa Teste TCC iPhone, com código de convite visível e o próprio usuário identificado como Administrador. A conta e a casa de teste permanecem salvas.

Estes resultados complementam os limites da revisão web acima. PDF, entrada de outro morador por convite e a rede do local da apresentação ainda não foram confirmados neste reteste. As validações negativas do cadastro/criação de casa no iPhone não foram confirmadas individualmente pelo usuário.
