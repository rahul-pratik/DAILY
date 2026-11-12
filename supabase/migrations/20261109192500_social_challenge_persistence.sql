-- DAILY social and challenge persistence.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
  ON public.profiles FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL AND username <> '';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS credits_count INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'likes_count'
  ) THEN
    UPDATE public.posts
    SET credits_count = COALESCE(likes_count, 0)
    WHERE credits_count = 0 AND likes_count > 0;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.post_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('credit', 'discredit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_post_credit UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_credits_post_id ON public.post_credits(post_id);
CREATE INDEX IF NOT EXISTS idx_post_credits_user_id ON public.post_credits(user_id);

DO $$
BEGIN
  IF to_regclass('public.post_likes') IS NOT NULL THEN
    INSERT INTO public.post_credits (post_id, user_id, vote_type)
    SELECT pl.post_id, pl.user_id, 'credit'
    FROM public.post_likes pl
    INNER JOIN public.posts p ON p.id = pl.post_id
    INNER JOIN public.profiles pr ON pr.id = pl.user_id
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.recalculate_post_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id UUID;
  net_credits INTEGER;
BEGIN
  target_post_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.post_id ELSE NEW.post_id END;

  SELECT COALESCE(SUM(CASE vote_type WHEN 'credit' THEN 1 ELSE -1 END), 0)
  INTO net_credits
  FROM public.post_credits
  WHERE post_id = target_post_id;

  UPDATE public.posts
  SET credits_count = GREATEST(0, net_credits),
      likes_count = GREATEST(0, net_credits)
  WHERE id = target_post_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalculate_post_credits ON public.post_credits;
CREATE TRIGGER trigger_recalculate_post_credits
AFTER INSERT OR UPDATE OR DELETE ON public.post_credits
FOR EACH ROW EXECUTE FUNCTION public.recalculate_post_credits();

ALTER TABLE public.post_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view post credits" ON public.post_credits;
CREATE POLICY "Public can view post credits"
  ON public.post_credits FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can insert own credits" ON public.post_credits;
CREATE POLICY "Users can insert own credits"
  ON public.post_credits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own credits" ON public.post_credits;
CREATE POLICY "Users can update own credits"
  ON public.post_credits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own credits" ON public.post_credits;
CREATE POLICY "Users can delete own credits"
  ON public.post_credits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view follows" ON public.follows;
CREATE POLICY "Public can view follows"
  ON public.follows FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated can insert follows" ON public.follows;
CREATE POLICY "Authenticated can insert follows"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Authenticated can delete follows" ON public.follows;
CREATE POLICY "Authenticated can delete follows"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view post comments" ON public.post_comments;
CREATE POLICY "Public can view post comments"
  ON public.post_comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can add own comments" ON public.post_comments;
CREATE POLICY "Authenticated users can add own comments"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors or post owners can delete comments" ON public.post_comments;
CREATE POLICY "Authors or post owners can delete comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_comments.post_id
        AND p.author_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.recalculate_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id UUID;
BEGIN
  target_post_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.post_id ELSE NEW.post_id END;
  UPDATE public.posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.post_comments WHERE post_id = target_post_id
  )
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalculate_post_comments ON public.post_comments;
CREATE TRIGGER trigger_recalculate_post_comments
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.recalculate_post_comments();

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'Medium';

ALTER TABLE public.cohort_proofs
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.cohort_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view cohort proofs" ON public.cohort_proofs;
CREATE POLICY "Public can view cohort proofs"
  ON public.cohort_proofs FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can submit own cohort proofs" ON public.cohort_proofs;
CREATE POLICY "Users can submit own cohort proofs"
  ON public.cohort_proofs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors can edit unverified cohort proofs" ON public.cohort_proofs;
CREATE POLICY "Authors can edit unverified cohort proofs"
  ON public.cohort_proofs FOR UPDATE TO authenticated
  USING (auth.uid() = author_id AND verified = FALSE)
  WITH CHECK (auth.uid() = author_id AND verified = FALSE);
DROP POLICY IF EXISTS "Challenge creators can verify cohort proofs" ON public.cohort_proofs;
CREATE POLICY "Challenge creators can verify cohort proofs"
  ON public.cohort_proofs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = cohort_proofs.challenge_id AND c.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = cohort_proofs.challenge_id AND c.creator_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.squad_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(trim(text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_squad_chat_messages_squad_created
  ON public.squad_chat_messages(squad_id, created_at);
ALTER TABLE public.squad_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Squad members can view squad messages" ON public.squad_chat_messages;
CREATE POLICY "Squad members can view squad messages"
  ON public.squad_chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_chat_messages.squad_id AND s.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_chat_messages.squad_id AND sm.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Squad members can send messages" ON public.squad_chat_messages;
CREATE POLICY "Squad members can send messages"
  ON public.squad_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_chat_messages.squad_id AND s.creator_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.squad_members sm
        WHERE sm.squad_id = squad_chat_messages.squad_id AND sm.user_id = auth.uid()
      )
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', TRUE),
  ('posts', 'posts', TRUE),
  ('proofs', 'proofs', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Daily uploads are publicly readable" ON storage.objects;
CREATE POLICY "Daily uploads are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'posts', 'proofs'));
DROP POLICY IF EXISTS "Users can upload own Daily media" ON storage.objects;
CREATE POLICY "Users can upload own Daily media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars', 'posts', 'proofs')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
DROP POLICY IF EXISTS "Users can update own Daily media" ON storage.objects;
CREATE POLICY "Users can update own Daily media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('avatars', 'posts', 'proofs')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'posts', 'proofs')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
DROP POLICY IF EXISTS "Users can delete own Daily media" ON storage.objects;
CREATE POLICY "Users can delete own Daily media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('avatars', 'posts', 'proofs')
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Squad chat read receipts
ALTER TABLE public.squad_chat_messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Squad message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.squad_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_message_emoji UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view message reactions" ON public.message_reactions;
CREATE POLICY "Public can view message reactions"
  ON public.message_reactions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can add own message reactions" ON public.message_reactions;
CREATE POLICY "Users can add own message reactions"
  ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own message reactions" ON public.message_reactions;
CREATE POLICY "Users can remove own message reactions"
  ON public.message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Persist globally reusable topic tags with case-insensitive uniqueness.
CREATE TABLE IF NOT EXISTS public.topic_hashtags (
  tag_key TEXT PRIMARY KEY,
  tag TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT topic_hashtags_key_matches_tag CHECK (tag_key = LOWER(tag))
);

ALTER TABLE public.topic_hashtags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view topic hashtags" ON public.topic_hashtags;
CREATE POLICY "Anyone can view topic hashtags"
  ON public.topic_hashtags FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Authenticated users can create topic hashtags" ON public.topic_hashtags;
CREATE POLICY "Authenticated users can create topic hashtags"
  ON public.topic_hashtags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND tag_key = LOWER(tag));

-- Link feed posts to their challenge so moderators can manage its posts and comments.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feed_visible BOOLEAN NOT NULL DEFAULT TRUE;

DROP POLICY IF EXISTS "Challenge moderators can delete challenge posts" ON public.posts;
CREATE POLICY "Challenge moderators can delete challenge posts"
  ON public.posts FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = posts.challenge_id AND c.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = posts.community_id AND c.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors or post owners can delete comments" ON public.post_comments;
CREATE POLICY "Authors or post owners can delete comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id AND (
        p.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.challenges c
          WHERE c.id = p.challenge_id AND c.creator_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.communities c
          WHERE c.id = p.community_id AND c.creator_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Challenge creators can delete cohort proofs" ON public.cohort_proofs;
CREATE POLICY "Challenge creators can delete cohort proofs"
  ON public.cohort_proofs FOR DELETE TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = cohort_proofs.challenge_id AND c.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Squad members can mark messages as read" ON public.squad_chat_messages;
CREATE POLICY "Squad members can mark messages as read"
  ON public.squad_chat_messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND read_at IS NULL
    AND (EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_chat_messages.squad_id AND s.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_chat_messages.squad_id AND sm.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND read_at IS NOT NULL
    AND (EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_chat_messages.squad_id AND s.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_members sm
      WHERE sm.squad_id = squad_chat_messages.squad_id AND sm.user_id = auth.uid()
    ))
  );

CREATE OR REPLACE FUNCTION public.prevent_squad_message_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.squad_id IS DISTINCT FROM OLD.squad_id
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.text IS DISTINCT FROM OLD.text
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR OLD.read_at IS NOT NULL
    OR NEW.read_at IS NULL
  THEN
    RAISE EXCEPTION 'Squad messages may only be marked as read once';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_squad_message_edits ON public.squad_chat_messages;
CREATE TRIGGER prevent_squad_message_edits
BEFORE UPDATE ON public.squad_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.prevent_squad_message_edits();

DROP POLICY IF EXISTS "Public can view message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Squad members can view message reactions" ON public.message_reactions;
CREATE POLICY "Squad members can view message reactions"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.squad_chat_messages message
      JOIN public.squads squad ON squad.id = message.squad_id
      WHERE message.id = message_reactions.message_id
        AND (
          squad.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.squad_members member
            WHERE member.squad_id = message.squad_id AND member.user_id = auth.uid()
          )
        )
    )
  );
DROP POLICY IF EXISTS "Users can add own message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Squad members can add own message reactions" ON public.message_reactions;
CREATE POLICY "Squad members can add own message reactions"
  ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.squad_chat_messages message
      JOIN public.squads squad ON squad.id = message.squad_id
      WHERE message.id = message_reactions.message_id
        AND (
          squad.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.squad_members member
            WHERE member.squad_id = message.squad_id AND member.user_id = auth.uid()
          )
        )
    )
  );
DROP POLICY IF EXISTS "Users can remove own message reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Squad members can remove own message reactions" ON public.message_reactions;
CREATE POLICY "Squad members can remove own message reactions"
  ON public.message_reactions FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.squad_chat_messages message
      JOIN public.squads squad ON squad.id = message.squad_id
      WHERE message.id = message_reactions.message_id
        AND (
          squad.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.squad_members member
            WHERE member.squad_id = message.squad_id AND member.user_id = auth.uid()
          )
        )
    )
  );
