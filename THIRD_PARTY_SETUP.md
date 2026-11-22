# SAVORUNE third-party setup

This guide separates integrations that are active in the codebase from optional PRD integrations that still require implementation. Never commit `.env`; configure the same variables in Vercel for Preview and Production.

## 1. Clerk authentication (active)

1. Create a Clerk application at `dashboard.clerk.com` and enable the sign-in methods you want.
2. In **API keys**, copy the publishable and secret keys into `.env`:

   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```

3. Add `http://localhost:3000` and the production domain to Clerk's allowed origins/redirect URLs.
4. Start the app, create an account, and complete `/onboarding`. A Clerk account without a SAVORUNE profile is always sent to onboarding; a completed user is sent to `/dashboard`.
5. Create admin users server-side only. Do not expose `ADMIN` in onboarding. The current app needs an admin bootstrap/seed entry whose `clerkUserId` exactly matches the Clerk user ID.

Verification: sign out, sign in with a new account, complete onboarding once, sign out/in again, and confirm the second login goes directly to the dashboard.

## 2. Neon PostgreSQL + Drizzle (client configured, application persistence not migrated)

1. Create a Neon project and database, then copy the pooled connection string.
2. Set `DATABASE_URL` in `.env` and in Vercel:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
   ```

3. Review the generated migration in `drizzle/0000_unique_master_mold.sql` before applying it.
4. Apply it from a trusted development machine:

   ```powershell
   npx drizzle-kit migrate
   ```

5. Important: the current workflows use `src/lib/store.ts` and `data/savorune-db.json`; merely setting `DATABASE_URL` does **not** move runtime data to Neon. Before production, replace store calls in API routes with Drizzle repositories/transactions and add a seed command. Claims, receiver capacity checks, and volunteer acceptance must use database transactions and row locks as required by the PRD.
6. Verify by creating a donation, restarting the app/deploy, and querying Neon to confirm the row still exists.

Do not deploy production traffic until step 5 is complete; Vercel's filesystem is not durable application storage.

## 3. Vercel deployment (supported target)

1. Import the repository into Vercel.
2. Use the default Next.js build command (`npm run build`).
3. Add the Clerk keys, `DATABASE_URL`, and the production URL:

   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.example
   ```

4. Add the Vercel domain to Clerk's allowed origins and redirects.
5. Deploy, then test visitor → sign-up → onboarding → dashboard and each role's protected route.

## 4. Resend email (optional; not implemented yet)

1. Create a Resend account, verify a sending domain, and create an API key.
2. Add `RESEND_API_KEY=re_...` and a verified sender such as `RESEND_FROM=SAVORUNE <updates@your-domain.example>`.
3. Install `resend`, create a server-only mail adapter, and call it only after a successful transaction. Resolve the recipient email from Clerk at send time; do not copy email addresses into SAVORUNE tables.
4. Make the adapter a no-op when the key is absent so the core lifecycle still succeeds (PRD AC-27).
5. Test with Resend's test recipient first, then verify claim, assignment, collection, and delivery notifications.

## 5. Trigger.dev workflows (optional; not implemented yet)

1. Create a Trigger.dev project and obtain its development/production secret.
2. Add `TRIGGER_SECRET_KEY=tr_...` in the matching environment.
3. Install the current Trigger.dev SDK and initialize it with the project configuration recommended by its dashboard.
4. Add idempotent expiry/reminder jobs. Keep lazy expiry in request paths so donations still expire correctly when Trigger.dev is unavailable (PRD AC-28).
5. Deploy the Trigger.dev worker, trigger a short-deadline test donation, and confirm rerunning the job does not duplicate status history.

## 6. Google Maps JavaScript API

1. In Google Cloud Console, enable billing and the **Maps JavaScript API** for the SAVORUNE project.
2. Create a browser API key and add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...` to `.env` and Vercel.
3. Apply **Websites** restrictions for `http://localhost:3000/*`, Preview domains, and the production domain.
4. Restrict the key to **Maps JavaScript API** only. A browser Maps key is intentionally visible to the client; referrer and API restrictions protect it.
5. Render only the synthetic Hyderabad zone coordinates. Never collect or display personal addresses.
6. The application provides a zone-list fallback when the key is missing or Google Maps cannot load, so onboarding remains usable.

## 7. Production verification checklist

- `npm run typecheck` and `npm run build` pass.
- Clerk redirects work on localhost, Preview, and Production.
- A new signed-in user cannot bypass onboarding; an onboarded user cannot reopen it.
- Data survives a redeploy and is present in Neon.
- Missing Resend/Trigger/map configuration never blocks post, match, claim, collect, or deliver.
- Secrets exist only in server-side environment variables; no secret uses the `NEXT_PUBLIC_` prefix.
- Rotate any key that was ever committed or exposed in logs.
