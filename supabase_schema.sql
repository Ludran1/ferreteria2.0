-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  category text not null,
  sku text,
  barcode text,
  image text,
  stock integer default 0
);

-- Quotes Table (Cotizaciones)
create table quotes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('pending', 'approved', 'rejected', 'converted')) default 'pending',
  total numeric not null
);

-- Quote Items
create table quote_items (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  custom_price numeric
);

-- Sales Table (Ventas)
create table sales (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  total numeric not null,
  payment_method text check (payment_method in ('cash', 'card', 'transfer', 'yape', 'plin')),
  invoice_number text
);

-- Sale Items
create table sale_items (
  id uuid default uuid_generate_v4() primary key,
  sale_id uuid references sales(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  price_at_sale numeric not null -- Store price at time of sale
);

-- Remission Guides (Guías de Remisión)
create table remission_guides (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sale_id uuid references sales(id),
  customer_name text not null,
  address text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('pending', 'delivered')) default 'pending'
);

-- Remission Items
create table remission_items (
  id uuid default uuid_generate_v4() primary key,
  remission_id uuid references remission_guides(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null
);

-- Row Level Security (RLS)
alter table products enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table remission_guides enable row level security;
alter table remission_items enable row level security;

-- Policies (Allow all authenticated users to read/write for now, or refine based on role later)
-- For simplicity in this step, allowing authenticated access.

create policy "Enable all access for authenticated users" on products for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on quotes for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on quote_items for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on sales for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on sale_items for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on remission_guides for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on remission_items for all using (auth.role() = 'authenticated');

-- Optional: Allow public read access to products if needed?
-- create policy "Allow public read products" on products for select using (true);

-- Profiles Table (Sync with auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  updated_at timestamp with time zone,
  name text,
  email text,
  role text default 'employee',
  allowed_sections text[]
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, allowed_sections)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    array(select jsonb_array_elements_text(new.raw_user_meta_data->'allowedSections'))
  );
  return new;
end;
$$ language plpgsql security definer;


-- Business Settings Table (Single Row)
create table business_settings (
  id bool primary key default true,
  name text default 'Ferretería El Martillo',
  address text default 'Av. Principal 123, Col. Centro, CP 12345',
  phone text default '555-123-4567',
  email text default 'contacto@ferreteria.com',
  rfc text default 'FEM123456789',
  constraint single_row check (id)
);

alter table business_settings enable row level security;
create policy "Enable all access for authenticated users" on business_settings for all using (auth.role() = 'authenticated');
create policy "Allow public read settings" on business_settings for select using (true);

-- Insert default row if not exists
insert into business_settings (id) values (true) on conflict (id) do nothing;
