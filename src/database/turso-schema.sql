-- Turso Database Schema for Cricket Scorecard Archiving

-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fixtures table
CREATE TABLE fixtures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  overs INTEGER DEFAULT 20,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  fixture_id TEXT,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_scorer TEXT,
  toss_winner TEXT,
  elected_to_bat TEXT,
  innings1_id TEXT,
  innings2_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fixture_id) REFERENCES fixtures(id)
);

-- Innings table
CREATE TABLE innings (
  id TEXT PRIMARY KEY,
  match_id TEXT,
  batting_team TEXT NOT NULL,
  bowling_team TEXT NOT NULL,
  total_runs INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Balls table
CREATE TABLE balls (
  id TEXT PRIMARY KEY,
  innings_id TEXT,
  batsman_id TEXT,
  bowler_id TEXT,
  runs INTEGER DEFAULT 0,
  extras_type TEXT CHECK (extras_type IN ('wide', 'noball', 'bye', 'legbye', NULL)),
  extras_runs INTEGER DEFAULT 0,
  ball_number REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (innings_id) REFERENCES innings(id),
  FOREIGN KEY (batsman_id) REFERENCES players(id),
  FOREIGN KEY (bowler_id) REFERENCES players(id)
);

-- Scorecard table
CREATE TABLE scorecard (
  id TEXT PRIMARY KEY,
  innings_id TEXT,
  player_id TEXT,
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  out_type TEXT CHECK (out_type IN ('bowled', 'caught', 'runout', 'lbw', 'stumped', 'notout', NULL)),
  out_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (innings_id) REFERENCES innings(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (out_by) REFERENCES players(id)
);

-- Indexes for performance
CREATE INDEX idx_matches_code ON matches(code);
CREATE INDEX idx_matches_fixture ON matches(fixture_id);
CREATE INDEX idx_innings_match ON innings(match_id);
CREATE INDEX idx_balls_innings ON balls(innings_id);
CREATE INDEX idx_scorecard_innings ON scorecard(innings_id);
CREATE INDEX idx_scorecard_player ON scorecard(player_id);