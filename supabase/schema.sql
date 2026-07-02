-- profiles extends auth.users (managed by Supabase Auth) with app data
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('client', 'provider')),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- pivot table: bookings link a client and a provider, everything else
-- (messages, notifications, payments) references a booking
create table bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  provider_id uuid not null references profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  service_title text not null,
  scheduled_at timestamptz,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

-- one row per chat message, scoped to a booking
create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  status text not null default 'sent'
    check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz not null default now()
);

-- speeds up loading a conversation's history in descending order
create index messages_booking_created_idx
  on messages (booking_id, created_at desc);

-- in-app notifications, one row per event, per recipient
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'booking_confirmed', 'new_message', 'reminder', 'review_requested', 'payment_received'
  )),
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on notifications (user_id, read_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  stripe_payment_intent_id text unique not null,
  status text not null check (status in (
    'processing', 'succeeded', 'card_declined', 'failed'
  )),
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  pdf_storage_path text not null,
  created_at timestamptz not null default now()
);  


alter table profiles enable row level security;
alter table bookings enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;

-- profiles are public read (name, avatar) — refine later if needed
create policy "profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "users see their own bookings"
  on bookings for select
  using (auth.uid() = client_id or auth.uid() = provider_id);

create policy "users see messages from their own bookings"
  on messages for select
  using (
    exists (
      select 1 from bookings
      where bookings.id = messages.booking_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

create policy "users send messages only on their own bookings"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings
      where bookings.id = messages.booking_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

create policy "users see their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "users see payments from their own bookings"
  on payments for select
  using (
    exists (
      select 1 from bookings
      where bookings.id = payments.booking_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );