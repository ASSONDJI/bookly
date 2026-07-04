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

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- explicit grants required because "automatically expose new tables"
-- is disabled at the project level (security-by-default choice)
grant usage on schema public to authenticated, anon;
grant select, insert on profiles to authenticated;
grant select on profiles to anon;
grant select, insert, update on bookings to authenticated;
grant select, insert on messages to authenticated;
grant select, update on notifications to authenticated;
grant select on payments to authenticated;
grant select on invoices to authenticated;


alter publication supabase_realtime add table messages;


create policy "users mark messages as read in their bookings"
  on messages for update
  using (
    exists (
      select 1 from bookings
      where bookings.id = messages.booking_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from bookings
      where bookings.id = messages.booking_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

grant update on messages to authenticated;

alter publication supabase_realtime add table notifications;

create policy "users mark their notifications as read"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, update on notifications to authenticated;
grant insert on notifications to authenticated;

create policy "authenticated users can create notifications for anyone"
  on notifications for insert
  with check (auth.role() = 'authenticated');


create policy "clients can create a payment for their own booking"
  on payments for insert
  with check (
    exists (
      select 1 from bookings
      where bookings.id = payments.booking_id
      and bookings.client_id = auth.uid()
    )
  );

grant insert on payments to authenticated;

grant select, update on payments to service_role;

-- storage policy: invoices bucket, scoped through payments -> bookings
create policy "users can read invoices from their own bookings"
  on storage.objects for select
  using (
    bucket_id = 'invoices'
    and exists (
      select 1 from invoices
      join payments on payments.id = invoices.payment_id
      join bookings on bookings.id = payments.booking_id
      where invoices.pdf_storage_path = storage.objects.name
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

grant select on storage.objects to authenticated;

grant insert, select on invoices to service_role;
grant insert, select on storage.objects to service_role;

create policy "service role can insert invoice files"
  on storage.objects for insert
  with check (bucket_id = 'invoices');

grant select on bookings to service_role;

create policy "users see invoices from their own bookings"
  on invoices for select
  using (
    exists (
      select 1 from payments
      join bookings on bookings.id = payments.booking_id
      where payments.id = invoices.payment_id
      and (bookings.client_id = auth.uid() or bookings.provider_id = auth.uid())
    )
  );

grant select on invoices to authenticated;


alter table profiles add column headline text;
alter table profiles add column bio text;
alter table profiles add column hourly_rate_cents integer;

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant update on profiles to authenticated;

create policy "clients can create bookings"
  on bookings for insert
  with check (client_id = auth.uid());

grant insert on bookings to authenticated;
