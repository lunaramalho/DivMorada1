# Saída lógica da residência e arquivos privados

Mantemos o vínculo do morador inativo, com data de saída, em vez de excluí-lo. Sair ou ser removido exige ausência de obrigações a pagar e a receber, incluindo análises e parcelamentos; o ex-morador perde o acesso à casa e ao histórico, mas os membros ativos continuam identificando sua participação nos registros. O retorno por convite reativa o mesmo vínculo, preserva a data de entrada original e registra um novo evento de entrada, sem recriar movimentações.

A saída e a criação de novas obrigações compartilham um bloqueio transacional da residência. A criação de despesa e de seus pagamentos passa a ser uma única operação: a validação apenas na tela ou em uma consulta anterior à saída permitiria que uma lista antiga de participantes gerasse novas obrigações para quem saiu.

O bucket existente de comprovantes torna-se privado sem mover nem apagar arquivos. Preservamos as referências históricas e resolvemos o acesso por URLs assinadas de 60 segundos somente após a verificação de permissão; fotos de perfil que compartilham o bucket também passam por essa resolução. A alternativa de manter links públicos deixaria comprovantes acessíveis fora da aplicação após a saída. Links assinados já emitidos podem continuar válidos até sua expiração, e downloads anteriores não são revogáveis.
