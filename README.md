# Viodz Toga Rental 2026

A mobile-friendly rental operations app for renter records, toga releases and returns, payment history, balances, late fees, finance summaries, CSV export, and printable reports.

## Run locally

```bash
npm install
npm run dev
```

The app saves records in the browser when Supabase is not configured. With Supabase environment variables, it loads remote renters and synchronizes renter, payment, release, return, and late-fee changes.

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Add authenticated staff policies for `renters` and `payments`. Row-level security is enabled by the schema and intentionally has no anonymous write policy.
3. Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Do not expose the service-role key in the web app.

## Import the attached 2026 renter lists

The checked-in importer reads the six supplied EDUC, Engineering, Forestry, IT, CAS, and HE files. It treats the legacy `Amount` field as the initial deposit, defaults the full price to ₱900, applies the documented CAS exceptions, and skips duplicate name-and-college pairs.

Validate all files without changing Supabase:

```bash
npm run seed:check
```

Import all 203 rows using a service-role key in the terminal only:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
npm run seed:supabase
```

The Renters page also has an **Import CSV** action for future college lists. Accepted columns include `Name`, `College`, `Address`, `Cell Number`, `Amount`, `Deposit`, `Total`, `Balance`, and `Due Date`.

## Production check

```bash
npm run build
```
