# Executar o DivMorada em outra rede

O backend atual é o Supabase. Não é necessário executar uma API local na porta 5000 nem configurar EXPO_PUBLIC_API_URL.

Após configurar o .env e instalar as dependências:

```powershell
npx expo login
npm run start:tunnel
```

Use a mesma conta Expo no computador e no Expo Go do iPhone. Leia o novo QR code do terminal e mantenha o servidor ligado.

O túnel exige internet e pode ser bloqueado pela rede do local. Ao mudar de túnel, revise os retornos de recuperação de senha no Supabase e, para a versão web pública, a origem permitida na função de cobrança.

O passo a passo completo está no [README](README.md).
