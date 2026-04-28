# Pharma Reps CRM MVP

## Backend (FastAPI)

1. Set environment variables (Postgres required):
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (default: `llama-3.1-8b-instant`)
   - `SUPABASE_DATABASE_URL` (preferred) or `DATABASE_URL`
   - Example: `postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require`

2. Run the API from the `api/` folder:

```bash
uvicorn run:app --reload
```

3. Example endpoints:
   - `POST /ai/chat`
   - `POST /interactions`
   - `GET /interactions/{hcp_name}`
