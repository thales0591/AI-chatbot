# Praxis

Boilerplate local com FastAPI em `back/` e Next.js em `front/`.

## Backend

Requer `uv`. Crie um arquivo `.env` na raiz com `OPENAI_API_KEY=`.
O boilerplate funciona com o valor vazio.

```sh
cd back
uv sync --locked
uv run --locked --env-file ../.env uvicorn main:app --reload
```

Documentação em <http://127.0.0.1:8000/docs>.

## Frontend

Requer Node.js 20.9 ou superior e npm.

```sh
cd front
npm ci
npm run dev
```

Abra <http://127.0.0.1:3000>. A página consulta `GET /health` no FastAPI
diretamente do navegador. Em caso de mudança de endereço, configure
`NEXT_PUBLIC_API_URL` no frontend e `FRONTEND_ORIGIN` no backend.
