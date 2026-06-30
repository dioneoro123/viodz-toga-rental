-- Run this in the Supabase SQL editor before connecting the production app.
create extension if not exists pgcrypto;

create type rental_status as enum ('Reserved', 'Released', 'Returned', 'Late', 'Damaged/Lost');
create type payment_method as enum ('Cash', 'GCash', 'Bank Transfer');

create table renters (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  dedupe_key text unique not null,
  name text not null,
  college text not null,
  address text not null default '',
  phone text not null,
  toga text not null,
  total_amount numeric(12,2) not null default 900 check (total_amount >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  manual_late_fee numeric(12,2) not null default 0 check (manual_late_fee >= 0),
  due_date date not null,
  status rental_status not null default 'Reserved',
  reserved_date date not null default current_date,
  release_date date,
  released_by text,
  returned_date date,
  review_note text,
  import_source text,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references renters(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null,
  payment_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index renters_name_idx on renters using gin (to_tsvector('simple', name));
create index renters_status_idx on renters(status);
create index renters_college_idx on renters(college);
create index payments_date_idx on payments(payment_date);

create view renter_finance as
select r.*,
  coalesce(sum(p.amount), 0) as additional_payments,
  greatest(0, r.total_amount + r.manual_late_fee - r.deposit_amount - coalesce(sum(p.amount), 0)) as balance
from renters r
left join payments p on p.renter_id = r.id
group by r.id;

alter table renters enable row level security;
alter table payments enable row level security;

-- Add authenticated staff policies after configuring Supabase Auth.
