-- Supabase init SQL
-- Creates basic schema for a RAG/chat app using pgvector

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector

-- Users table (simple, can be linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- Documents / source texts
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz DEFAULT now()
);

-- Embeddings table (uses pgvector). Adjust vector dimension to your model (e.g., 1536 for OpenAI text-embedding-3-small)
CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  model text,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for vector search (IVFFlat). You may tune 'lists' depending on size.
-- Note: to create an ivfflat index you should first ANALYZE the table and ensure the extension is available
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING ivfflat (embedding) WITH (lists = 100);

-- Chat sessions and messages
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL, -- e.g., 'user'|'assistant'|'system'
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Example helper: nearest neighbor search returning distance
-- Input: query vector with same dimensionality
CREATE OR REPLACE FUNCTION nn_search_embeddings(q vector(1536), k int DEFAULT 5)
RETURNS TABLE(id uuid, document_id uuid, distance double precision)
LANGUAGE sql STABLE AS $$
  SELECT id, document_id, (embedding <-> q) AS distance
  FROM embeddings
  ORDER BY embedding <-> q
  LIMIT k;
$$;

-- Optional: basic sample data (comment out if you don't want seeds)
-- INSERT INTO users (email, full_name) VALUES ('alice@example.com', 'Alice');
-- INSERT INTO documents (user_id, title, content) VALUES ((SELECT id FROM users LIMIT 1), 'Example', 'This is an example document');

-- Tips:
-- 1) Adjust vector(1536) to your embedding model dimension.
-- 2) After bulk-inserting embeddings, run: ANALYZE embeddings; then REINDEX or rebuild IVFFlat index.
-- 3) Use Supabase SQL editor or psql (connect via SUPABASE_DB_HOST/PORT/USER/PASSWORD) to run this script.

-- End of file
