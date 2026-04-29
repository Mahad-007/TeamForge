-- ============================================================
-- Phase 3: Wiki Full-Text Search
-- ============================================================

-- Function to extract text from JSONB block content
CREATE OR REPLACE FUNCTION extract_wiki_text(content JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  block JSONB;
  inline_item JSONB;
BEGIN
  IF content IS NULL OR jsonb_typeof(content) != 'array' THEN
    RETURN '';
  END IF;

  FOR block IN SELECT jsonb_array_elements(content)
  LOOP
    -- Extract text from content array within each block
    IF block->'content' IS NOT NULL AND jsonb_typeof(block->'content') = 'array' THEN
      FOR inline_item IN SELECT jsonb_array_elements(block->'content')
      LOOP
        IF inline_item->>'text' IS NOT NULL THEN
          result := result || ' ' || (inline_item->>'text');
        END IF;
      END LOOP;
    END IF;

    -- Recurse into children blocks
    IF block->'children' IS NOT NULL AND jsonb_typeof(block->'children') = 'array' THEN
      result := result || ' ' || extract_wiki_text(block->'children');
    END IF;
  END LOOP;

  RETURN trim(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add FTS column to wiki_pages
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || extract_wiki_text(content))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_wiki_pages_fts ON wiki_pages USING gin(fts);
