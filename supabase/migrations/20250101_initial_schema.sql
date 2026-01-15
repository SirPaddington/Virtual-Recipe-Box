-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Households (for family sharing)
create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Household members with roles
create type household_role as enum ('owner', 'admin', 'member');

create table public.household_members (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role household_role default 'member',
  joined_at timestamptz default now(),
  unique(household_id, user_id)
);

-- Recipes
create type recipe_category as enum ('cooking', 'baking', 'beverage', 'other');
create type recipe_visibility as enum ('private', 'household', 'public');

create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.users(id) on delete set null,
  household_id uuid references public.households(id) on delete cascade,
  parent_recipe_id uuid references public.recipes(id) on delete set null,
  title text not null,
  description text,
  category recipe_category default 'cooking',
  visibility recipe_visibility default 'household',
  prep_time_minutes int,
  cook_time_minutes int,
  servings int default 1,
  source_url text,
  image_url text, -- NULL for variations = inherit from parent
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Helper function to get recipe image (with parent fallback for variations)
create or replace function get_recipe_image(recipe_id uuid)
returns text as $$
  with recursive recipe_chain as (
    select id, image_url, parent_recipe_id from public.recipes where id = recipe_id
    union all
    select r.id, r.image_url, r.parent_recipe_id 
    from public.recipes r
    join recipe_chain rc on r.id = rc.parent_recipe_id
    where rc.image_url is null
  )
  select image_url from recipe_chain where image_url is not null limit 1;
$$ language sql stable;

-- Standard units enum (imperial includes pinch/dash for small amounts)
create type unit_type as enum (
  -- Imperial/Volume
  'tsp', 'tbsp', 'cup', 'fl_oz', 'pint', 'quart', 'gallon',
  'oz', 'lb',
  -- Metric/Weight
  'ml', 'l', 'g', 'kg',
  -- Small amounts
  'pinch', 'dash',
  -- Counts
  'piece', 'whole', 'slice', 'clove', 'sprig', 'leaf',
  -- Other
  'to_taste', 'as_needed'
);

-- Ingredients with dual units
create table public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  name text not null,
  qty_imperial decimal,
  unit_imperial unit_type,
  qty_metric decimal,
  unit_metric unit_type,
  sort_order int default 0,
  notes text
);

-- Instructions
create table public.instructions (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  step_number int not null,
  content text not null,
  duration_minutes int,
  temperature text
);

-- Comments on recipes
create table public.recipe_comments (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Cooking notes (personal log)
create table public.cooking_notes (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  cooked_on date default current_date,
  multiplier decimal default 1.0,
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

-- User favorites
create table public.user_favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);

-- Indexes for performance
create index idx_recipes_household on public.recipes(household_id);
create index idx_recipes_author on public.recipes(author_id);
create index idx_recipes_parent on public.recipes(parent_recipe_id);
create index idx_ingredients_recipe on public.ingredients(recipe_id);
create index idx_instructions_recipe on public.instructions(recipe_id);
create index idx_user_favorites_user on public.user_favorites(user_id);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.instructions enable row level security;
alter table public.recipe_comments enable row level security;
alter table public.cooking_notes enable row level security;
alter table public.user_favorites enable row level security;

-- Users: can read all, update own, insert own during signup
create policy "Users can view all users" on public.users for select using (true);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Households: members can view, owner can update, authenticated users can create
create policy "Members can view household" on public.households for select
  using (id in (select household_id from public.household_members where user_id = auth.uid()));
create policy "Authenticated users can create household" on public.households for insert
  with check (auth.uid() = owner_id);
create policy "Owner can update household" on public.households for update
  using (owner_id = auth.uid());

-- Household members: can view own memberships, insert when joining
create policy "Users can view own household memberships" on public.household_members for select
  using (user_id = auth.uid());
create policy "Users can insert own household membership" on public.household_members for insert
  with check (user_id = auth.uid());

-- Recipes: based on visibility and household membership
create policy "View public recipes" on public.recipes for select
  using (visibility = 'public');
create policy "View household recipes" on public.recipes for select
  using (
    visibility = 'household' 
    and household_id in (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );
create policy "View own private recipes" on public.recipes for select
  using (visibility = 'private' and author_id = auth.uid());
create policy "Author can update recipe" on public.recipes for update
  using (author_id = auth.uid());
create policy "Household members can insert recipes" on public.recipes for insert
  with check (
    household_id in (
      select household_id from public.household_members where user_id = auth.uid()
    )
  );

-- Ingredients/Instructions: inherit from recipe access
create policy "View ingredients" on public.ingredients for select
  using (recipe_id in (select id from public.recipes));
create policy "Author can modify ingredients" on public.ingredients for all
  using (recipe_id in (select id from public.recipes where author_id = auth.uid()));

create policy "View instructions" on public.instructions for select
  using (recipe_id in (select id from public.recipes));
create policy "Author can modify instructions" on public.instructions for all
  using (recipe_id in (select id from public.recipes where author_id = auth.uid()));

-- Favorites: user's own
create policy "Users manage own favorites" on public.user_favorites for all
  using (user_id = auth.uid());

-- Comments: viewable by recipe viewers, writable by authenticated users
create policy "View comments" on public.recipe_comments for select
  using (recipe_id in (select id from public.recipes));
create policy "Users can add comments" on public.recipe_comments for insert
  with check (user_id = auth.uid());

-- Cooking notes: personal only
create policy "Users manage own cooking notes" on public.cooking_notes for all
  using (user_id = auth.uid());
