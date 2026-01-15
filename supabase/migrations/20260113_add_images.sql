-- Create storage bucket for recipe images
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Create recipe_images table
create table public.recipe_images (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  instruction_id uuid references public.instructions(id) on delete cascade, -- Nullable, if null = main image
  url text not null,
  storage_path text not null,
  caption text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- Index for lookups
create index idx_recipe_images_recipe on public.recipe_images(recipe_id);
create index idx_recipe_images_instruction on public.recipe_images(instruction_id);

-- Enable RLS
alter table public.recipe_images enable row level security;

-- Policies for recipe_images table (Access controlled by recipe visibility)
create policy "View images for visible recipes" on public.recipe_images for select
using (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_images.recipe_id
    and (
      r.visibility = 'public'
      or (
        r.visibility = 'household' 
        and r.household_id in (select household_id from public.household_members where user_id = auth.uid())
      )
      or (r.visibility = 'private' and r.author_id = auth.uid())
    )
  )
);

create policy "Authors and household members can upload images" on public.recipe_images for insert
with check (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_images.recipe_id
    and (
      r.author_id = auth.uid() OR
      r.household_id in (select household_id from public.household_members where user_id = auth.uid())
    )
  )
);

create policy "Authors can delete images" on public.recipe_images for delete
using (
  exists (
    select 1 from public.recipes r
    where r.id = recipe_images.recipe_id
    and r.author_id = auth.uid()
  )
);

-- STORAGE POLICIES (Supabase Storage RLS)
-- Allow public read access to the bucket
create policy "Public Access" on storage.objects for select
using ( bucket_id = 'recipe-images' );

-- Allow authenticated uploads
create policy "Authenticated Upload" on storage.objects for insert
with check (
  bucket_id = 'recipe-images' 
  and auth.role() = 'authenticated'
);

-- Allow owners to delete
create policy "Owner Delete" on storage.objects for delete
using (
  bucket_id = 'recipe-images' 
  and auth.uid() = owner
);
