# Medinex

Medinex stores a patient's medical history in one place. When the patient visits the doctor again, an AI model generates a short summary of that history, so the doctor can quickly understand the patient's past records without reading everything.

## Features

- Store and manage patient medical history and documents
- AI-generated summary of a patient's history for follow-up visits
- Separate roles for patients and doctors
- Secure storage using Supabase

## Tech Stack

| Part | Technology |
|------|------------|
| Frontend | React |
| Backend | Python |
| Database and Auth | Supabase |
| AI Summaries | Google Gemini API |

## Project Structure

```
backend/    Python backend (API, Supabase client, AI summary logic)
frontend/   React app
docs/       Project documentation
scripts/    Helper scripts
supabase_schema.sql                  Database schema
supabase_migration_dual_role.sql     Migration for dual roles
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nilya_575/Medinex.git
cd Medinex
```

### 2. Set up the database

Run `supabase_schema.sql` in your Supabase project's SQL editor, then run `supabase_migration_dual_role.sql`.

### 3. Environment variables

Create a `.env` file inside the `backend` folder with these variables (use your own values):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Never commit your `.env` file or share these keys.

### 4. Run the backend

```bash
cd backend
pip install -r requirements.txt
# TODO: add the command used to start the backend
```

### 5. Run the frontend

```bash
cd frontend
npm install
npm start
```

## Team

This project was built as a minor project by a team of four:

- Nilya ([@Nilya_575](https://github.com/Nilya_575))
- Anmol
- Ishika
- Ananya

## Future Improvements

- Support more document types
- Better summary quality and multi-language summaries
- Doctor-side search and filters

## Documentation

More details are available in the [`docs`](./docs) folder.
