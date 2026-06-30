-- Run after enabling Supabase Auth for staff accounts.
-- These policies allow signed-in staff to manage renters and payments.

create policy "Staff can read renters"
on public.renters for select
to authenticated
using (true);

create policy "Staff can add renters"
on public.renters for insert
to authenticated
with check (true);

create policy "Staff can update renters"
on public.renters for update
to authenticated
using (true)
with check (true);

create policy "Staff can read payments"
on public.payments for select
to authenticated
using (true);

create policy "Staff can add payments"
on public.payments for insert
to authenticated
with check (true);

create policy "Staff can update payments"
on public.payments for update
to authenticated
using (true)
with check (true);

create policy "Staff can delete payments"
on public.payments for delete
to authenticated
using (true);
