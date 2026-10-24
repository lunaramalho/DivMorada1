# Atualização para Expo SDK 58

Solicitada em 24/10/2026 para testar no Expo Go 58.0.5 do iPhone.

O usuário decidiu aplicar a atualização no projeto principal `DivMorada1`, em vez de continuar na cópia `DivMorada-sdk58`. A cópia inicial foi interrompida após instalar apenas o pacote Expo; não deve ser usada como versão final de teste.

Antes de atualizar o projeto principal, foi salvo um backup dos arquivos atuais em `C:/Users/Matheus/Documents/DivMorada-backup-sdk54-20261024`, incluindo alterações ainda não commitadas. `node_modules`, `.git` e `.expo` não fazem parte do backup. Para recuperar o ambiente anterior, restaurar os arquivos em um local separado e instalar pelo `package-lock.json` do backup; não misturar dependências dos SDKs.

As configurações locais de acesso ao mesmo Supabase foram preservadas. O teste no SDK 58 usa os mesmos dados reais do aplicativo; não é um banco de testes separado. Nenhum e-mail, pagamento ou alteração de senha deve ser disparado apenas para testar a atualização sem escolher explicitamente o registro e a ação.

## Migrações

- Pacotes Expo, React, React Native e módulos nativos alinhados pela CLI ao SDK 58.
- `SafeAreaView` das telas migrado de `react-native` para `react-native-safe-area-context`.
- Opções removidas `newArchEnabled` e `android.edgeToEdgeEnabled` retiradas do app.json.
- Avatares usam `StyleSheet.absoluteFill`, compatível com a API estrita do React Native 0.88.
- Tipos de cores dos ícones das abas e nomes SF Symbols atualizados; tratamento de URL inicial aceita ausência de valor.
- Inicialização da sessão ajustada às regras do React Compiler, sem atualização síncrona de estado no efeito.
- A conta Expo do computador e do iPhone deve ser a mesma. A autenticação Expo é diferente do login do DivMorada.

## Referências

- https://expo.dev/blog/how-to-upgrade-to-sdk-58
- https://expo.dev/changelog/sdk-58
- https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

## Verificação

Expo 58.0.19, React Native 0.88.0, React 19.3.0, TypeScript 6.0.3. TypeScript e lint aprovados; Expo Doctor 20/20; árvore de dependências sem erros no nível principal; onze testes de sessão/alertas/recuperação e suíte de cobrança aprovados. Exportação iOS e web concluída: bundle Hermes iOS de 3,9 MB (1372 módulos), 19 bundles web e 22 rotas estáticas. Saída local: `C:/Users/Matheus/.codex/tmp/divmorada-sdk58-export`.

A instalação inicial foi interrompida por falhas no Windows e refeita com pasta e lock limpos. As dependências incompletas foram movidas para subpastas do backup, não reutilizadas. A instalação final usou `npm install --legacy-peer-deps`; ao executar npm ci, manter esse parâmetro de resolução.

O teste iOS em dispositivo real só estará confirmado após abrir o projeto e percorrer as telas no iPhone.

## Teste no iPhone e correção de fotos

O usuário confirmou que o DivMorada abriu e todas as páginas puderam ser acessadas no iPhone. Reportou erro intermitente ao carregar uma foto cujo valor salvo era `blob:http://localhost:8081/...`.

Corrigida a causa: alteração de foto passa a enviar bytes ao Storage e salvar a URL pública permanente, no prefixo `avatares/<usuario>/` do bucket existente. A imagem temporária selecionada no cadastro também não é mais gravada no metadata. Se o cadastro não fornecer sessão para upload, ou se o upload falhar, a conta é criada e a interface orienta adicionar a foto pelo Perfil após entrar. Avatares persistidos rejeitam URLs locais ou blob antes de chamar o carregador nativo e mostram a inicial do nome.

Fotos antigas com URL temporária não podem ser recuperadas a partir do banco; o usuário precisa selecioná-las novamente. Nenhum registro antigo foi apagado ou substituído em lote.

TypeScript e testes de URLs/upload aprovados; reteste no aparelho com uma foto escolhida pelo usuário pendente.
