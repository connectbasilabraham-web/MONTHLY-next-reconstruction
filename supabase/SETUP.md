# Supabase account setup

## Database and profile photos

Run [`migrations/20261113160000_accounts_and_avatars.sql`](./migrations/20261113160000_accounts_and_avatars.sql) in the Supabase SQL Editor (or apply it with the Supabase CLI). It creates the per-user finance-data table with row-level security and the public `avatars` bucket. Avatar uploads and deletes are limited to the signed-in user’s folder.

## Email accounts

In **Authentication → Providers**, enable Email. If email confirmation is on, configure production SMTP in **Project Settings → Authentication → SMTP Settings** so confirmation and password-reset emails can reach all users. Add your local and production app callback URLs under **Authentication → URL Configuration → Redirect URLs**, for example:

- `http://localhost:3000/**`
- `https://your-domain.example/**`

Set the production **Site URL** to your app’s origin.

## Google sign-in

Enable Google in **Authentication → Providers → Google** and use the same OAuth client ID and secret registered in Google Cloud. In Google Cloud, add this exact authorized redirect URI:

`https://asvfzvskxmjguilqrjzk.supabase.co/auth/v1/callback`

Do not substitute your app URL here; Google redirects to Supabase first. Separately, allow your app URL (for example `http://localhost:3000/auth/callback`) in Supabase’s Redirect URLs. Keep the Supabase service-role key and Google client secret out of the browser and source control.
