-- Pokusy
CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  nickname TEXT,
  final_score INTEGER NOT NULL,
  base_score INTEGER NOT NULL,
  total_penalty INTEGER NOT NULL,
  percentile INTEGER NOT NULL,
  personality TEXT NOT NULL,
  breakdown JSONB NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX attempts_score_idx ON public.attempts (final_score DESC);
CREATE INDEX attempts_created_idx ON public.attempts (created_at DESC);
CREATE INDEX attempts_share_id_idx ON public.attempts (share_id);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert an attempt (anonymously)
CREATE POLICY "Anyone can insert attempts"
  ON public.attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read attempts (leaderboard, share links)
CREATE POLICY "Anyone can read attempts"
  ON public.attempts FOR SELECT
  TO anon, authenticated
  USING (true);