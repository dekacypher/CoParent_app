-- Create documents table for secure file storage
CREATE TABLE IF NOT EXISTS documents (
  id serial PRIMARY KEY,
  uploaded_by varchar NOT NULL REFERENCES users(id),
  child_id integer REFERENCES children(id),
  title text NOT NULL,
  description text,
  category text NOT NULL, -- 'medical', 'legal', 'receipt', 'school', 'court', 'other'
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL, -- in bytes
  file_type text NOT NULL, -- MIME type
  shared_with text[] NOT NULL DEFAULT ARRAY[]::text[], -- Array of user IDs
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_child_id ON documents(child_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE documents IS 'Secure document storage for co-parents. Supports sharing and categorization.';
COMMENT ON COLUMN documents.shared_with IS 'Array of user IDs who can access this document';
COMMENT ON COLUMN documents.tags IS 'Custom tags for document organization';
