# 隠語 | Ingo

This is an attempt for determining Domain specific words on a piece of content. 

The current logic is to get words that are uncommon in a frequency list, that are common in the target content. Dunning log likelihood keyness or Dunning G2 is being used for this. 

It currently only works for Japanese, support for other languages will probably be done in separate Repos

## How it's built

Two pieces that run side by side:

- **Frontend** (project root) — Next.js/React. Renders the UI, does all filtering/sorting/pagination client-side over whatever the last upload returned. Never re-fetches when you tune a filter.
- **Backend** (`ingo-api/`) — a small synchronous FastAPI service. One request does everything: parse the uploaded file(s) → tokenize with fugashi/UniDic → score each term's keyness against the reference frequency data → look up a definition via JMDict → return the finished list. No job queue, no database.

## Running locally

Requires **Node.js 18+** and **Python 3.11**. The two servers run independently and must both be up at the same time.

### 1. Backend

```
cd ingo-api
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

`fugashi`/`unidic-lite` and `jamdict`/`jamdict-data` pull down real dictionary data on install — expect this step to take a while and use real disk space (~700MB for the venv, mostly the JMDict and UniDic data).

**Frequency data**: scoring needs `ingo-api/data/freq_ja.json.gz`. If it's already there, skip this step. If it's missing (e.g. a fresh clone — it isn't committed yet), place one or more Yomitan `term_meta_bank_*.json` files in the project root and build it:

```
python scripts/build_freq.py
```

Then start the server:

```
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to confirm it's up.

### 2. Frontend

From the project root, in a separate terminal:

```
npm install
npm run dev
```

Open `http://localhost:3000`. If the backend runs somewhere other than `localhost:8000`, point the frontend at it with a `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running tests

```
npm test                       # frontend (Vitest)
cd ingo-api && pytest pipeline # backend (pytest)
```
