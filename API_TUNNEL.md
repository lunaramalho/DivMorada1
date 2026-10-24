# Como rodar o app com API local e Expo Tunnel

Todas as requisicoes do app passam por `src/services/api.ts`.
Voce nao precisa alterar `login`, `users`, `despesas`, `pagamentos` etc. Basta configurar a URL base da API.

## 1. Rodar a API

Em um terminal:

```powershell
cd C:\Users\Matheus\Documents\api-devmoradia\api
npm run dev
```

A API precisa estar na porta `5000`.

## 2. Criar tunnel para a API

Em outro terminal:

```powershell
ngrok http 5000
```

Copie a URL HTTPS gerada, por exemplo:

```text
https://abc123.ngrok-free.app
```

Nao coloque `:5000` no final da URL do ngrok.

## 3. Configurar a URL no app

Crie um arquivo `.env.local` na pasta `DivMorada`:

```powershell
cd C:\Users\Matheus\Documents\api-devmoradia\DivMorada
copy .env.example .env.local
```

Abra `.env.local` e troque pela URL real:

```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
```

## 4. Rodar o Expo

Na pasta `DivMorada`:

```powershell
npm run start:tunnel
```

ou:

```powershell
npx expo start --tunnel --clear
```

## Quando a URL do ngrok mudar

Atualize apenas o arquivo `.env.local`:

```env
EXPO_PUBLIC_API_URL=https://nova-url.ngrok-free.app
```

Depois reinicie o Expo com cache limpo:

```powershell
npm run start:tunnel
```
