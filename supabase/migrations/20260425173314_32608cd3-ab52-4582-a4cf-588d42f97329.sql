ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_final_score_range CHECK (final_score BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_base_score_range CHECK (base_score BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_percentile_range CHECK (percentile BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_penalty_nonneg CHECK (total_penalty >= 0),
  ADD CONSTRAINT attempts_time_nonneg CHECK (total_time_ms >= 0 AND total_time_ms < 3600000),
  ADD CONSTRAINT attempts_nickname_len CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 1 AND 24),
  ADD CONSTRAINT attempts_share_id_format CHECK (share_id ~ '^[a-zA-Z0-9]{6,12}$'),
  ADD CONSTRAINT attempts_personality_known CHECK (personality IN ('internet_ninja','overconfident_victim','scam_magnet','clickbait_zombie','cautious_but_vulnerable'));