create extension if not exists moddatetime with schema extensions;

do $$
begin
  create type public.catalog_listing_status as enum (
    'draft',
    'pending_review',
    'published',
    'unpublished',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.catalog_listing_format_type as enum (
    'physical',
    'ebook'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publishers_name_not_blank check (length(btrim(name)) > 0)
);

create unique index if not exists publishers_name_unique_idx
on public.publishers (lower(name));

drop trigger if exists handle_publishers_updated_at on public.publishers;
create trigger handle_publishers_updated_at
before update on public.publishers
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authors_name_not_blank check (length(btrim(name)) > 0)
);

create unique index if not exists authors_name_unique_idx
on public.authors (lower(name));

drop trigger if exists handle_authors_updated_at on public.authors;
create trigger handle_authors_updated_at
before update on public.authors
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.genres (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint genres_name_not_blank check (length(btrim(name)) > 0),
  constraint genres_not_self_parent check (parent_id is null or parent_id <> id)
);

create unique index if not exists genres_root_name_unique_idx
on public.genres (lower(name))
where parent_id is null;

create unique index if not exists genres_child_name_unique_idx
on public.genres (parent_id, lower(name))
where parent_id is not null;

create or replace function public.enforce_genre_depth()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null and exists (
    select 1
    from public.genres parent
    where parent.id = new.parent_id
      and parent.parent_id is not null
  ) then
    raise exception 'Genres support only one parent level';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_genre_depth_before_write on public.genres;
create trigger enforce_genre_depth_before_write
before insert or update of parent_id on public.genres
for each row
execute function public.enforce_genre_depth();

drop trigger if exists handle_genres_updated_at on public.genres;
create trigger handle_genres_updated_at
before update on public.genres
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  publisher_id uuid references public.publishers (id) on delete set null,
  title text not null,
  subtitle text,
  publication_year integer,
  language text not null,
  isbn text,
  cover_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_title_not_blank check (length(btrim(title)) > 0),
  constraint books_language_not_blank check (length(btrim(language)) > 0),
  constraint books_publication_year_reasonable check (
    publication_year is null
    or (publication_year >= 0 and publication_year <= extract(year from now())::integer + 2)
  )
);

create unique index if not exists books_id_library_id_unique_idx
on public.books (id, library_id);

create index if not exists books_library_id_idx on public.books (library_id);
create index if not exists books_isbn_idx on public.books (isbn) where isbn is not null;
create index if not exists books_publisher_id_idx on public.books (publisher_id);

drop trigger if exists handle_books_updated_at on public.books;
create trigger handle_books_updated_at
before update on public.books
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.book_authors (
  book_id uuid not null references public.books (id) on delete cascade,
  author_id uuid not null references public.authors (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (book_id, author_id)
);

create index if not exists book_authors_author_id_idx
on public.book_authors (author_id);

create table if not exists public.book_genres (
  book_id uuid not null references public.books (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (book_id, genre_id)
);

create index if not exists book_genres_genre_id_idx
on public.book_genres (genre_id);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null,
  book_id uuid not null,
  status public.catalog_listing_status not null default 'draft',
  approval_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_book_library_fkey foreign key (book_id, library_id)
    references public.books (id, library_id)
    on delete cascade
);

create index if not exists listings_library_id_idx on public.listings (library_id);
create index if not exists listings_book_id_idx on public.listings (book_id);
create index if not exists listings_status_idx on public.listings (status);

create or replace function public.enforce_listing_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  has_cover boolean;
  ebook_missing_file boolean;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Listings must be created as draft';
    end if;

    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'draft' and new.status = 'pending_review')
    or (old.status = 'pending_review' and new.status = 'published')
    or (old.status = 'published' and new.status = 'unpublished')
    or (old.status = 'unpublished' and new.status = 'archived')
  ) then
    raise exception 'Invalid listing status transition from % to %', old.status, new.status;
  end if;

  if new.status = 'published' then
    select b.cover_image_path is not null and length(btrim(b.cover_image_path)) > 0
    into has_cover
    from public.books b
    where b.id = new.book_id;

    if not coalesce(has_cover, false) then
      raise exception 'A cover image is required before publishing';
    end if;

    select exists (
      select 1
      from public.listing_formats lf
      where lf.listing_id = new.id
        and lf.format_type = 'ebook'
        and (lf.ebook_file_path is null or length(btrim(lf.ebook_file_path)) = 0)
    )
    into ebook_missing_file;

    if coalesce(ebook_missing_file, false) then
      raise exception 'An ebook file is required before publishing ebook listings';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_listing_status_before_write on public.listings;
create trigger enforce_listing_status_before_write
before insert or update of status on public.listings
for each row
execute function public.enforce_listing_status_transition();

drop trigger if exists handle_listings_updated_at on public.listings;
create trigger handle_listings_updated_at
before update on public.listings
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.listing_formats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  format_type public.catalog_listing_format_type not null,
  price numeric(12, 2) not null,
  ebook_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_formats_price_positive check (price >= 0),
  constraint listing_formats_physical_file_rule check (
    format_type = 'ebook'
    or ebook_file_path is null
  )
);

create unique index if not exists listing_formats_listing_type_unique_idx
on public.listing_formats (listing_id, format_type);

create index if not exists listing_formats_listing_id_idx
on public.listing_formats (listing_id);

drop trigger if exists handle_listing_formats_updated_at on public.listing_formats;
create trigger handle_listing_formats_updated_at
before update on public.listing_formats
for each row
execute function extensions.moddatetime('updated_at');

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  listing_format_id uuid not null unique references public.listing_formats (id) on delete cascade,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_stock_non_negative check (stock_quantity >= 0)
);

create index if not exists inventory_listing_format_id_idx
on public.inventory (listing_format_id);

drop trigger if exists handle_inventory_updated_at on public.inventory;
create trigger handle_inventory_updated_at
before update on public.inventory
for each row
execute function extensions.moddatetime('updated_at');

alter table public.publishers enable row level security;
alter table public.authors enable row level security;
alter table public.genres enable row level security;
alter table public.books enable row level security;
alter table public.book_authors enable row level security;
alter table public.book_genres enable row level security;
alter table public.listings enable row level security;
alter table public.listing_formats enable row level security;
alter table public.inventory enable row level security;

drop policy if exists "Catalog reference data is publicly readable" on public.publishers;
create policy "Catalog reference data is publicly readable"
on public.publishers for select to public using (true);

drop policy if exists "Catalog staff can write publishers" on public.publishers;
create policy "Catalog staff can write publishers"
on public.publishers for all to authenticated
using (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Catalog reference data is publicly readable" on public.authors;
create policy "Catalog reference data is publicly readable"
on public.authors for select to public using (true);

drop policy if exists "Catalog staff can write authors" on public.authors;
create policy "Catalog staff can write authors"
on public.authors for all to authenticated
using (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Catalog reference data is publicly readable" on public.genres;
create policy "Catalog reference data is publicly readable"
on public.genres for select to public using (true);

drop policy if exists "Catalog staff can write genres" on public.genres;
create policy "Catalog staff can write genres"
on public.genres for all to authenticated
using (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  public.authorize('library_staff')
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Published catalog books are public" on public.books;
create policy "Published catalog books are public"
on public.books for select to public
using (
  exists (
    select 1
    from public.listings l
    join public.libraries lib on lib.id = l.library_id
    where l.book_id = books.id
      and l.status = 'published'
      and lib.status = 'active'
  )
);

drop policy if exists "Library staff can manage own books" on public.books;
create policy "Library staff can manage own books"
on public.books for all to authenticated
using (
  public.authorize_library('library_staff', library_id)
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  public.authorize_library('library_staff', library_id)
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Published book authors are public" on public.book_authors;
create policy "Published book authors are public"
on public.book_authors for select to public
using (
  exists (
    select 1
    from public.books b
    where b.id = book_authors.book_id
  )
);

drop policy if exists "Library staff can manage book authors" on public.book_authors;
create policy "Library staff can manage book authors"
on public.book_authors for all to authenticated
using (
  exists (
    select 1
    from public.books b
    where b.id = book_authors.book_id
      and (
        public.authorize_library('library_staff', b.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
)
with check (
  exists (
    select 1
    from public.books b
    where b.id = book_authors.book_id
      and (
        public.authorize_library('library_staff', b.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
);

drop policy if exists "Published book genres are public" on public.book_genres;
create policy "Published book genres are public"
on public.book_genres for select to public
using (
  exists (
    select 1
    from public.books b
    where b.id = book_genres.book_id
  )
);

drop policy if exists "Library staff can manage book genres" on public.book_genres;
create policy "Library staff can manage book genres"
on public.book_genres for all to authenticated
using (
  exists (
    select 1
    from public.books b
    where b.id = book_genres.book_id
      and (
        public.authorize_library('library_staff', b.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
)
with check (
  exists (
    select 1
    from public.books b
    where b.id = book_genres.book_id
      and (
        public.authorize_library('library_staff', b.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
);

drop policy if exists "Published active listings are public" on public.listings;
create policy "Published active listings are public"
on public.listings for select to public
using (
  status = 'published'
  and exists (
    select 1
    from public.libraries lib
    where lib.id = listings.library_id
      and lib.status = 'active'
  )
);

drop policy if exists "Library staff can manage own listings" on public.listings;
create policy "Library staff can manage own listings"
on public.listings for all to authenticated
using (
  public.authorize_library('library_staff', library_id)
  or public.authorize('admin')
  or public.authorize('superadmin')
)
with check (
  public.authorize_library('library_staff', library_id)
  or public.authorize('admin')
  or public.authorize('superadmin')
);

drop policy if exists "Visible listing formats are readable" on public.listing_formats;
create policy "Visible listing formats are readable"
on public.listing_formats for select to public
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_formats.listing_id
  )
);

drop policy if exists "Library staff can manage listing formats" on public.listing_formats;
create policy "Library staff can manage listing formats"
on public.listing_formats for all to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_formats.listing_id
      and (
        public.authorize_library('library_staff', l.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_formats.listing_id
      and (
        public.authorize_library('library_staff', l.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
);

drop policy if exists "Visible inventory is readable" on public.inventory;
create policy "Visible inventory is readable"
on public.inventory for select to public
using (
  exists (
    select 1
    from public.listing_formats lf
    join public.listings l on l.id = lf.listing_id
    where lf.id = inventory.listing_format_id
      and l.status = 'published'
      and exists (
        select 1
        from public.libraries lib
        where lib.id = l.library_id
          and lib.status = 'active'
      )
  )
);

drop policy if exists "Library staff can manage inventory" on public.inventory;
create policy "Library staff can manage inventory"
on public.inventory for all to authenticated
using (
  exists (
    select 1
    from public.listing_formats lf
    join public.listings l on l.id = lf.listing_id
    where lf.id = inventory.listing_format_id
      and (
        public.authorize_library('library_staff', l.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
)
with check (
  exists (
    select 1
    from public.listing_formats lf
    join public.listings l on l.id = lf.listing_id
    where lf.id = inventory.listing_format_id
      and (
        public.authorize_library('library_staff', l.library_id)
        or public.authorize('admin')
        or public.authorize('superadmin')
      )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book_covers', 'book_covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('ebook_files', 'ebook_files', false, 104857600, array['application/pdf', 'application/epub+zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Catalog covers are publicly readable" on storage.objects;
create policy "Catalog covers are publicly readable"
on storage.objects for select to public
using (bucket_id = 'book_covers');

drop policy if exists "Library staff can upload catalog covers" on storage.objects;
create policy "Library staff can upload catalog covers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'book_covers'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
    else false
  end
);

drop policy if exists "Library staff can update catalog covers" on storage.objects;
create policy "Library staff can update catalog covers"
on storage.objects for update to authenticated
using (
  bucket_id = 'book_covers'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
    else false
  end
)
with check (
  bucket_id = 'book_covers'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
    else false
  end
);

drop policy if exists "Library staff can delete catalog covers" on storage.objects;
create policy "Library staff can delete catalog covers"
on storage.objects for delete to authenticated
using (
  bucket_id = 'book_covers'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
);

drop policy if exists "Library staff can read ebook files" on storage.objects;
create policy "Library staff can read ebook files"
on storage.objects for select to authenticated
using (
  bucket_id = 'ebook_files'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
);

drop policy if exists "Library staff can upload ebook files" on storage.objects;
create policy "Library staff can upload ebook files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ebook_files'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
);

drop policy if exists "Library staff can update ebook files" on storage.objects;
create policy "Library staff can update ebook files"
on storage.objects for update to authenticated
using (
  bucket_id = 'ebook_files'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
)
with check (
  bucket_id = 'ebook_files'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
);

drop policy if exists "Library staff can delete ebook files" on storage.objects;
create policy "Library staff can delete ebook files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'ebook_files'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.authorize_library('library_staff', ((storage.foldername(name))[1])::uuid)
      or public.authorize('admin')
      or public.authorize('superadmin')
    else false
  end
);

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table
  public.publishers,
  public.authors,
  public.genres,
  public.books,
  public.book_authors,
  public.book_genres,
  public.listings,
  public.listing_formats,
  public.inventory
to anon, authenticated, service_role;

notify pgrst, 'reload schema';

comment on table public.books is
  'Canonical library-owned book records. ISBN duplicates are warned in application logic but allowed.';

comment on table public.listings is
  'Vendor-owned listing lifecycle uses draft -> pending_review -> published -> unpublished -> archived.';
