# Saída voluntária de moradores

Especificação aprovada a partir do pedido enviado pelo usuário. As regras abaixo incluem a revisão de acesso ao histórico e a proteção de comprovantes confirmadas na conversa.

## Regras definidas

- A página Casa oferecerá Sair da residência abaixo da lista de moradores, com aparência discreta em vermelho, somente para membros comuns. O administrador não poderá sair por esse fluxo.
- A saída depende da ausência de obrigações financeiras: valores a pagar, valores a receber, pagamentos informados aguardando confirmação, solicitações de parcelamento pendentes e parcelas não quitadas. Saldo líquido zero não é suficiente.
- A verificação ocorrerá no servidor. A validação final e a desativação do vínculo serão atômicas e deverão impedir que uma nova obrigação seja criada para alguém que acabou de sair.
- Havendo pendências, a saída será bloqueada com a mensagem solicitada e, quando possível, um resumo com acesso às telas correspondentes.
- Sem pendências, uma confirmação explícita será necessária antes da saída. A mensagem deverá informar que o acesso à casa anterior será encerrado, inclusive ao histórico.
- A saída preservará o vínculo histórico, as despesas, pagamentos, recebimentos, parcelamentos, comprovantes e responsáveis, sem excluir ou recalcular valores.
- Os moradores ativos continuarão tendo acesso aos registros antigos necessários, com identificação dos ex-moradores.
- O ex-morador perderá todo acesso à residência anterior, inclusive aos próprios registros históricos nessa casa. Essa decisão substitui o requisito de acesso histórico do ex-morador presente no texto original.
- A saída manterá a conta, o perfil e a autenticação. O aplicativo limpará a residência ativa e abrirá a tela para criar ou entrar em uma residência.
- O usuário poderá entrar em outra residência sem alterar os registros da anterior.
- O usuário poderá retornar à mesma residência usando um código de convite válido, desde que não possua vínculo ativo com outra casa. O retorno recuperará o acesso normal de morador, sem recriar dívidas nem alterar pagamentos antigos.
- A pessoa terá no máximo uma residência ativa; essa restrição deverá valer também nas verificações do servidor.
- A remoção pelo administrador deverá preservar o histórico e aplicar a validação de pendências, corrigindo a exclusão física atual do vínculo.
- Os comprovantes terão acesso privado: URLs públicas antigas deixarão de conceder acesso no servidor, e a abertura pelo aplicativo exigirá autorização de participação ativa na casa. Os arquivos e as referências existentes serão preservados.
- Ao abrir um arquivo, o aplicativo solicitará um link temporário com validade de 60 segundos. Um link temporário emitido antes da saída poderá funcionar até expirar; cópias já baixadas não podem ser revogadas. O ex-morador não poderá emitir novos links de comprovantes da casa anterior.
- Fotos de perfil permanecem vinculadas à conta. Como compartilham o armazenamento com os comprovantes, também serão exibidas por acesso autorizado; a própria foto continua disponível ao usuário sem residência.

## Pontos encontrados no código atual

- O vínculo em residencia_usuarios já possui ativo e joinedAt; a remoção administrativa apaga a linha.
- As permissões financeiras dependem da participação ativa, o que é compatível com o bloqueio de acesso após a saída.
- A entrada por convite atualmente recusa qualquer vínculo existente com a mesma residência, mesmo inativo.
- A tela Casa precisa filtrar moradores ativos e evitar selecionar automaticamente uma casa anterior após a saída.

## Implementação

- Casa: botão Sair da residência para membros comuns, confirmação, resumo de pendências com atalhos e remoção administrativa pela mesma validação.
- Backend: vínculo mantido com ativo=false e leftAt; uma única casa ativa por usuário; entrada por convite pode reativar o mesmo vínculo. joinedAt original é preservado; entradas e saídas são registradas no histórico.
- A saída confere pagamentos pendentes, valores a receber e solicitações pendentes separadamente. O status PENDENTE da despesa, isoladamente, não impede saída após seus pagamentos terem sido confirmados, pois o aplicativo não atualiza automaticamente esse status ao quitar os pagamentos.
- A criação de casa e a criação de despesa com seus pagamentos agora usam funções atômicas. O bloqueio da linha da residência é compartilhado com a saída e com gatilhos de validação de participantes; requisições com listas antigas não conseguem criar obrigação para ex-morador.
- As permissões preservam a identificação de antigos participantes para moradores ativos, sem devolver ao ex-morador o acesso aos registros da casa.
- Ao sair, a residência local é limpa e a tela de entrada/criação é aberta, mantendo a autenticação. Navegar ou retornar ao aplicativo também verifica se a participação ainda está ativa, inclusive após remoção pelo administrador.
- Storage privado com políticas de leitura por vínculo e referências de pagamentos/solicitações. Políticas restritivas impedem que uma política permissiva antiga reabra o bucket; clientes não podem sobrescrever nem apagar comprovantes.

## Ativação no Supabase

Aplicar uma única vez o conteúdo completo de `supabase/migrations/202611090001_house_departure.sql` no SQL Editor do projeto DivMorada, após as migrações de cobranças e parcelamento. Não reaplicar `supabase-schema.sql`: ele contém as políticas antigas e reabre o bucket público.

O usuário confirmou a execução desta migração no SQL Editor com o resultado “Success. No rows returned”. Não executar novamente no mesmo banco. As instruções de aplicação acima servem para outros ambientes.

A migração usa uma transação e interrompe a aplicação, sem escolher nem desativar vínculos automaticamente, se encontrar alguém com mais de uma casa ativa. Nesse caso, revisar os vínculos existentes antes de tentar novamente.

Depois do sucesso, recarregar as sessões do aplicativo. Versões antigas deixam de criar casas/despesas e de alterar participações por escrita direta: os clientes devem usar o código atualizado. O bucket privado também exige o código atualizado para exibir as fotos e os comprovantes.

## Validação realizada

- `npm test`: 30 testes aprovados, incluindo seis cenários de integração com PostgreSQL embarcado para saída e dois testes do acesso a arquivos. Cobrem saída sem pendências, valores a pagar/a receber com saldo líquido zero, confirmação e parcelamento pendentes, parcelas quitadas, remoção administrativa, retorno e mudança de casa, preservação de registros e permissões de arquivos.
- A disputa entre saída e nova despesa foi verificada nas duas ordens de execução (despesa primeiro e saída primeiro), usando as funções reais no banco local. PGlite possui uma conexão: o ensaio com duas conexões PostgreSQL simultâneas ainda está pendente.
- TypeScript, lint e regressão de cobranças por e-mail aprovados.
- A rota `/house` compilou e respondeu HTTP 200 no Expo.
- Os testes automatizados não alteraram o Supabase remoto. O usuário aplicou a migração pelo painel e confirmou o resultado de sucesso; teste visual em web/celular e teste do Storage HTTP real continuam pendentes.

## Arquivos desta alteração

- `supabase/migrations/202611090001_house_departure.sql`: funções, restrição de uma casa ativa, bloqueios e permissões de arquivos.
- `src/services/api.ts`: operações de saída, criação atômica de casa/despesa e remoção das escritas diretas de vínculos.
- `src/services/protectedStorage.ts`: resolução autorizada de referências antigas para links temporários.
- `src/features/house/hooks/useHouse.ts`, `src/features/house/types.ts`, `src/features/house/components/HouseResidentRow.tsx`, `src/features/house/components/DeparturePendingModal.tsx` e `app/(tabs)/house.tsx`: saída, remoção e apresentação de pendências.
- `src/features/house-onboarding/hooks/useHouseOnboarding.ts`, `app/(tabs)/_layout.tsx` e `app/_layout.tsx`: criação de residência, redirecionamento e verificação da participação ativa.
- `src/components/AvatarContent.tsx`, `app/payment-history.tsx` e `app/confirmations.tsx`: abertura autorizada de fotos e comprovantes.
- `tests/house-departure.test.mjs`, `tests/protected-storage.test.mjs` e `package.json`: novas verificações automatizadas.
- `GLOSSARY.md`, `README.md`, este documento e `docs/adr/0003-saida-logica-e-arquivos-privados.md`: regras, decisão e instruções de ativação.

## Ensaio após ativação

1. Como membro sem pendências, cancelar a confirmação de saída: nada muda. Confirmar: abrir entrada/criação, mantendo o login.
2. Como administrador, conferir que o ex-morador saiu da lista ativa e que nomes, valores, datas, comprovantes e pagamentos antigos permanecem no histórico.
3. Como ex-morador, verificar que URLs públicas antigas de comprovantes não abrem. Após expirar um link temporário emitido antes da saída, confirmar que ele também não abre; tentar obter novo link deve falhar.
4. Conferir a abertura de comprovantes (imagem e PDF) e fotos nas contas autorizadas. Conferir a própria foto mesmo sem casa ativa.
5. Entrar em outra casa; tentar entrar/criar uma terceira deve ser bloqueado. Sair da segunda e retornar à primeira pelo código: nenhum pagamento ou dívida será recriado.
6. Repetir a saída/remoção com dívida, recebível, pagamento informado e parcelamento pendentes: deve bloquear e informar os motivos.
7. Em duas sessões simultâneas, confirmar a saída enquanto outra cria uma despesa envolvendo o morador: a saída deve bloquear se a despesa vencer a disputa; a despesa deve falhar integralmente se a saída vencer.

## Decisões

Veja [saída lógica e arquivos privados](adr/0003-saida-logica-e-arquivos-privados.md). Referência para o modelo de armazenamento: [buckets privados do Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals).
