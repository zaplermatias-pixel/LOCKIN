-- Create Workouts Table
create table if not exists workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  workout_date date not null default current_date,
  description text,
  activity_type text check (activity_type in ('gym', 'run', 'bike', 'swim', 'hike', 'yoga', 'crossfit', 'sports', 'other')) not null,
  location text,
  song_name text,
  song_artist text,
  is_deleted boolean default false
);

-- Enable RLS
alter table workouts enable row level security;

-- Policies
create policy "Workouts are viewable by everyone" on workouts
  for select using (true);

create policy "Users can insert their own workouts" on workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own workouts" on workouts
  for update using (auth.uid() = user_id);

create policy "Users can delete their own workouts" on workouts
  for delete using (auth.uid() = user_id);

-- Create Indexes for performance
create index if not exists workouts_user_id_idx on workouts(user_id);
create index if not exists workouts_workout_date_idx on workouts(workout_date);
