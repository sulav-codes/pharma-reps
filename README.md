# Pharma Reps CRM MVP

## Backend (FastAPI)

1. Set environment variables:
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (default: `gemma2-9b-it`)
   - `SUPABASE_DATABASE_URL` (preferred) or `DATABASE_URL`
     - Example: `postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require`
     - If you see a `postgres://` URL, it is normalized to `postgresql://` at runtime.

2. Run the API from the `api/` folder:

```bash
uvicorn run:app --reload
```

3. Example endpoints:
   - `POST /ai/chat`
   - `POST /interactions`
   - `GET /interactions/{hcp_name}`
