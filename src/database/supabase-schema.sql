-- Supabase Database Schema for Cricket Scorecard Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'admin', 'superadmin'));
  END IF;
END $$;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS team TEXT;

-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  overs INTEGER NOT NULL DEFAULT 20,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fixtures
  ADD COLUMN IF NOT EXISTS overs INTEGER NOT NULL DEFAULT 20;

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_scorer UUID REFERENCES profiles(id),
  toss_winner TEXT,
  elected_to_bat TEXT,
  innings1_id UUID,
  innings2_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS current_scorer UUID REFERENCES profiles(id);
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS toss_winner TEXT;
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS elected_to_bat TEXT;

-- Innings table
CREATE TABLE IF NOT EXISTS innings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  batting_team TEXT NOT NULL,
  bowling_team TEXT NOT NULL,
  total_runs INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs DECIMAL(4,1) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update matches to reference innings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_innings1' AND table_name = 'matches') THEN
        ALTER TABLE matches ADD CONSTRAINT fk_innings1 FOREIGN KEY (innings1_id) REFERENCES innings(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_innings2' AND table_name = 'matches') THEN
        ALTER TABLE matches ADD CONSTRAINT fk_innings2 FOREIGN KEY (innings2_id) REFERENCES innings(id);
    END IF;
END $$;

-- Balls table (for detailed scoring)
CREATE TABLE IF NOT EXISTS balls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  innings_id UUID REFERENCES innings(id) ON DELETE CASCADE,
  batsman_id UUID REFERENCES players(id),
  bowler_id UUID REFERENCES players(id),
  runs INTEGER DEFAULT 0,
  extras_type TEXT CHECK (extras_type IN ('wide', 'noball', 'bye', 'legbye', NULL)),
  extras_runs INTEGER DEFAULT 0,
  is_wicket BOOLEAN DEFAULT FALSE,
  commentary TEXT,
  ball_number DECIMAL(4,1) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE balls
  ADD COLUMN IF NOT EXISTS is_wicket BOOLEAN DEFAULT FALSE;
ALTER TABLE balls
  ADD COLUMN IF NOT EXISTS commentary TEXT;

-- Scorecard table (player stats per innings)
CREATE TABLE IF NOT EXISTS scorecard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  innings_id UUID REFERENCES innings(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  out_type TEXT CHECK (out_type IN ('bowled', 'caught', 'runout', 'lbw', 'stumped', 'notout', NULL)),
  out_by UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON teams;
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Authenticated users can create players" ON players;
DROP POLICY IF EXISTS "Authenticated users can delete players" ON players;
DROP POLICY IF EXISTS "Anyone can view fixtures" ON fixtures;
DROP POLICY IF EXISTS "Authenticated users can create fixtures" ON fixtures;
DROP POLICY IF EXISTS "Users can update own fixtures" ON fixtures;
DROP POLICY IF EXISTS "Anyone can view matches with code" ON matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can update matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can delete matches" ON matches;
DROP POLICY IF EXISTS "Match owner can delete matches" ON matches;
DROP POLICY IF EXISTS "Admins can delete matches" ON matches;
DROP POLICY IF EXISTS "Anyone can view innings" ON innings;
DROP POLICY IF EXISTS "Authenticated users can manage innings" ON innings;
DROP POLICY IF EXISTS "Anyone can view balls" ON balls;
DROP POLICY IF EXISTS "Authenticated users can manage balls" ON balls;
DROP POLICY IF EXISTS "Anyone can view scorecard" ON scorecard;
DROP POLICY IF EXISTS "Authenticated users can manage scorecard" ON scorecard;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM profiles AS current_profile
    WHERE current_profile.id = auth.uid()
      AND current_profile.role IN ('admin', 'superadmin')
  )
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM profiles AS current_profile
    WHERE current_profile.id = auth.uid()
      AND current_profile.role IN ('admin', 'superadmin')
  )
);

-- Teams: Anyone can read, authenticated users can create/delete
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete teams" ON teams FOR DELETE USING (auth.uid() IS NOT NULL);

-- Players: Anyone can read, authenticated users can create/delete
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create players" ON players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete players" ON players FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fixtures: Anyone can read, authenticated users can create/update
CREATE POLICY "Anyone can view fixtures" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create fixtures" ON fixtures FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own fixtures" ON fixtures FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Matches: Anyone can read, authenticated users can create/update
CREATE POLICY "Anyone can view matches with code" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update matches" ON matches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Match owner can delete matches" ON matches FOR DELETE USING (
  current_scorer = auth.uid()
);
CREATE POLICY "Admins can delete matches" ON matches FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles AS current_profile
    WHERE current_profile.id = auth.uid()
      AND current_profile.role IN ('admin', 'superadmin')
  )
);

-- Innings: Anyone can read, authenticated users can manage
CREATE POLICY "Anyone can view innings" ON innings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage innings" ON innings FOR ALL USING (auth.uid() IS NOT NULL);

-- Balls: Anyone can read, authenticated users can manage
CREATE POLICY "Anyone can view balls" ON balls FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage balls" ON balls FOR ALL USING (auth.uid() IS NOT NULL);

-- Scorecard: Anyone can read, authenticated users can manage
CREATE POLICY "Anyone can view scorecard" ON scorecard FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage scorecard" ON scorecard FOR ALL USING (auth.uid() IS NOT NULL);

-- Functions and Triggers

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate match code
CREATE OR REPLACE FUNCTION generate_match_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM matches WHERE matches.code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_code ON matches(code);
CREATE INDEX IF NOT EXISTS idx_matches_fixture ON matches(fixture_id);

-- Keep only the newest active match per fixture before enforcing uniqueness
WITH ranked_active_matches AS (
  SELECT
    id,
    fixture_id,
    ROW_NUMBER() OVER (
      PARTITION BY fixture_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM matches
  WHERE status = 'active'
)
UPDATE matches
SET status = 'completed',
    updated_at = NOW()
WHERE id IN (
  SELECT id
  FROM ranked_active_matches
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_per_fixture ON matches(fixture_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_innings_match ON innings(match_id);
CREATE INDEX IF NOT EXISTS idx_balls_innings ON balls(innings_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_innings ON scorecard(innings_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_player ON scorecard(player_id);