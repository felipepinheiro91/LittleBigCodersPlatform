# Frontend LittleBIG Coders

Interface responsiva construída com React, Vite e Chakra UI, baseada nos requisitos de estudantes e professores.

## Execução

```bash
npm install
npm run dev
```

A API Django é esperada em `http://127.0.0.1:8000/api` por padrão. Para outro endereço, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Integração atual

- Login real: `POST /api/token/` e `GET /api/me/`
- Fluxos de materiais, provas, conquistas e sequência didática: dados demonstrativos enquanto o backend não oferece endpoints para esses domínios.
