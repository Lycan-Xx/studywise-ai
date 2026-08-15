-- Migration: add structural heading hints to courses
-- These columns store the headings detected client-side during file extraction
-- so that retryGeneration can re-use the same structural hints without the
-- student having to re-upload the file.
--
-- detected_headings: JSONB array of { text, level, position } objects
-- heading_detection_method: how the headings were found ('html' | 'markdown' | 'heuristic' | 'none')

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS detected_headings      JSONB    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS heading_detection_method TEXT   NOT NULL DEFAULT 'none'
    CHECK (heading_detection_method IN ('html', 'markdown', 'heuristic', 'none'));

COMMENT ON COLUMN courses.detected_headings IS
  'Structural headings extracted client-side from the uploaded file (h1–h3 from DOCX HTML, # from markdown, heuristic patterns from plain text). Stored so retryGeneration can re-use the same module boundary hints.';

COMMENT ON COLUMN courses.heading_detection_method IS
  'How detected_headings were found: html (mammoth docx tags, highest confidence), markdown (# prefix), heuristic (ALL-CAPS, numbered sections), or none (no headings found).';
