-- EcoBuddy AI Database Schema
-- Run this in the Supabase SQL Editor to initialize the database tables.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak_count integer default 0 not null,
  green_score integer default 50 not null, -- Scale of 0 - 100
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow public read-access to profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow authenticated users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Allow users to insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);


-- 2. Planet States Table
create table public.planet_states (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  vegetation float default 0.5 not null,        -- Scale of 0.0 - 1.0
  rivers float default 0.5 not null,            -- Scale of 0.0 - 1.0
  wildlife float default 0.5 not null,          -- Scale of 0.0 - 1.0
  atmosphere_clarity float default 0.5 not null, -- Scale of 0.0 - 1.0
  pollution float default 0.2 not null,         -- Scale of 0.0 - 1.0
  desertification float default 0.3 not null,   -- Scale of 0.0 - 1.0
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Planet States
alter table public.planet_states enable row level security;

-- Planet States Policies
create policy "Allow users to read their own planet state" 
  on public.planet_states for select 
  using (auth.uid() = profile_id);

create policy "Allow users to update their own planet state" 
  on public.planet_states for update 
  using (auth.uid() = profile_id);

create policy "Allow users to insert their own planet state" 
  on public.planet_states for insert 
  with check (auth.uid() = profile_id);


-- 3. Sustainability Logs Table
create table public.sustainability_logs (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category text not null, -- 'transport', 'diet', 'energy', 'waste'
  description text not null,
  carbon_offset float not null, -- positive for offsets/reductions, negative for emissions in kg
  co2_emission float not null,  -- absolute emission values in kg
  xp_earned integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Sustainability Logs
alter table public.sustainability_logs enable row level security;

-- Sustainability Logs Policies
create policy "Allow users to read their own logs" 
  on public.sustainability_logs for select 
  using (auth.uid() = profile_id);

create policy "Allow users to insert their own logs" 
  on public.sustainability_logs for insert 
  with check (auth.uid() = profile_id);

create policy "Allow users to update/delete their own logs" 
  on public.sustainability_logs for all 
  using (auth.uid() = profile_id);


-- 4. Achievements Definitions Table
create table public.achievements (
  id text primary key, -- static slug e.g. 'first_scan'
  name text not null,
  description text not null,
  badge_url text not null,
  xp_reward integer default 100 not null
);

-- Enable RLS on Achievements
alter table public.achievements enable row level security;

-- Achievements Policies
create policy "Allow public read access to achievements definitions" 
  on public.achievements for select 
  using (true);


-- 5. User Achievements Table (Join Table)
create table public.user_achievements (
  profile_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (profile_id, achievement_id)
);

-- Enable RLS on User Achievements
alter table public.user_achievements enable row level security;

-- User Achievements Policies
create policy "Allow users to read their own unlocked achievements" 
  on public.user_achievements for select 
  using (auth.uid() = profile_id);

create policy "Allow users to insert their own unlocked achievements" 
  on public.user_achievements for insert 
  with check (auth.uid() = profile_id);


-- 6. Daily Challenges Table
create table public.daily_challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  xp_reward integer not null,
  category text not null,
  target_value float not null,
  action_type text not null -- e.g. 'log_transport', 'scan_receipt', 'chat_twin'
);

-- Enable RLS on Daily Challenges
alter table public.daily_challenges enable row level security;

-- Daily Challenges Policies
create policy "Allow public read access to daily challenges" 
  on public.daily_challenges for select 
  using (true);


-- 7. Chat History Table
create table public.chat_history (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  sender text not null, -- 'user' or 'ai'
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Chat History
alter table public.chat_history enable row level security;

-- Chat History Policies
create policy "Allow users to read their own chat history" 
  on public.chat_history for select 
  using (auth.uid() = profile_id);

create policy "Allow users to insert their own chat messages" 
  on public.chat_history for insert 
  with check (auth.uid() = profile_id);

create policy "Allow users to delete their own chat history" 
  on public.chat_history for delete 
  using (auth.uid() = profile_id);


-- 8. Groups Table (Communities)
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null, -- 'family', 'hostel', 'office', 'college'
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Groups
alter table public.groups enable row level security;

-- Groups Policies
create policy "Allow all authenticated users to read groups" 
  on public.groups for select 
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to create groups" 
  on public.groups for insert 
  with check (auth.uid() = created_by);


-- 9. Group Members Table
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, profile_id)
);

-- Enable RLS on Group Members
alter table public.group_members enable row level security;

-- Group Members Policies
create policy "Allow authenticated users to view group memberships" 
  on public.group_members for select 
  using (auth.role() = 'authenticated');

create policy "Allow users to join groups" 
  on public.group_members for insert 
  with check (auth.uid() = profile_id);

create policy "Allow users to leave groups" 
  on public.group_members for delete 
  using (auth.uid() = profile_id);


-- 10. Leaderboards Materialized View / Cache Table (Fictionalized + Sync)
create table public.leaderboards (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  username text not null,
  xp integer not null,
  green_score integer not null,
  rank_movement integer default 0 not null, -- -1 (down), 0 (stable), 1 (up)
  last_calculated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on Leaderboards
alter table public.leaderboards enable row level security;

-- Leaderboards Policies
create policy "Allow public read access to leaderboards" 
  on public.leaderboards for select 
  using (true);

create policy "Allow system sync of leaderboards" 
  on public.leaderboards for all 
  using (true);


-- 11. Initial Seeding of Static Achievements and Challenges
insert into public.achievements (id, name, description, badge_url, xp_reward) values
  ('first_scan', 'First EcoSnap', 'Scanned your first receipt or item using computer vision.', '/badges/badge_scan.png', 150),
  ('first_level_up', 'Sprouting Up', 'Reached Level 2 and started your sustainability journey.', '/badges/badge_level.png', 200),
  ('streak_7', 'Eco Devotee', 'Maintained a 7-day sustainable action logging streak.', '/badges/badge_streak.png', 300),
  ('carbon_detective', 'Carbon Detective', 'Found your top carbon contributors using the Carbon Detective tool.', '/badges/badge_detective.png', 250)
on conflict (id) do nothing;

insert into public.daily_challenges (title, description, xp_reward, category, target_value, action_type) values
  ('Eco Transportation', 'Use public transport, bike, or walk to work/school today.', 120, 'transport', 1, 'log_transport'),
  ('Green Meal', 'Log a meal that is fully plant-based (vegan or vegetarian).', 100, 'diet', 1, 'scan_meal'),
  ('Eco Companion Advice', 'Consult your AI Sustainability Twin about a greener alternative.', 80, 'chat_twin', 1, 'chat_twin'),
  ('EcoSnap Action', 'Scan a utility bill or grocery receipt to analyze impact.', 150, 'energy', 1, 'scan_receipt')
on conflict do nothing;
