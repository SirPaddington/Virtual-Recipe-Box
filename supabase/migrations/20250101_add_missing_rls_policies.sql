-- Add missing RLS INSERT policies for signup flow
-- Run this in Supabase SQL Editor if you've already run the initial migration

-- Allow users to insert their own profile during signup
create policy "Users can insert own profile" on public.users for insert 
  with check (auth.uid() = id);

-- Allow authenticated users to create households
create policy "Authenticated users can create household" on public.households for insert
  with check (auth.uid() = owner_id);

-- Allow users to view and insert their own household memberships
create policy "Users can view own household memberships" on public.household_members for select
  using (user_id = auth.uid());
  
create policy "Users can insert own household membership" on public.household_members for insert
  with check (user_id = auth.uid());
