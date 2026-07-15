# Authentication & Session Flow

This document details the authentication and session management flow using Supabase Auth for the Senior Citizen Assistance Platform. The primary mechanism is Phone-Based Authentication with an optional PIN, leveraging `auth.users` for identity.

## 1. Initial Onboarding (Signup)

1. **User Enters Phone Number**: User inputs their `+63` formatted phone number on the entry screen.
2. **OTP Generation**:
   - The Next.js client calls `supabase.auth.signInWithOtp({ phone: '+63...' })`.
   - Supabase generates a 6-digit OTP and sends it via the configured SMS provider (e.g., Twilio/Semaphore via custom webhook if needed).
3. **OTP Verification**:
   - User inputs the 6-digit OTP.
   - Client calls `supabase.auth.verifyOtp({ phone: '+63...', token: '123456', type: 'sms' })`.
   - Upon success, a Supabase session is established (`access_token`, `refresh_token`), and an entry is created in `auth.users`.
4. **Onboarding Steps**:
   - Now authenticated, the user is prompted to enter their Full Name, Address (via Geolocation or manual input), and upload their ID document.
   - User can optionally set a 4-6 digit PIN. Since Supabase requires a 6-character password, this PIN will be stored as the user's password using `supabase.auth.updateUser({ password: 'user-pin' })` (must enforce exactly 6 digits).
   - The onboarding data is saved to `user_profiles`, `user_addresses`, and `id_documents`.
   - `user_profiles.verification_status` is set to `PENDING_ADMIN_REVIEW`.

## 2. Returning User Login (Subsequent Logins)

1. **User Enters Phone Number**:
   - Client checks if the user has an existing account (by querying an edge function or a public RPC that checks if the phone exists, without revealing sensitive info).
2. **PIN vs. OTP Path**:
   - **If PIN was set during onboarding**: User is prompted for their 6-digit PIN. Client calls `supabase.auth.signInWithPassword({ phone: '+63...', password: 'user-pin' })`.
   - **If NO PIN was set (OTP-only)**: Client calls `supabase.auth.signInWithOtp({ phone: '+63...' })` and the user waits for an SMS.
3. **Session Re-established**:
   - Successful PIN or OTP verification grants the user a new session token valid for 30 days.

## 3. Session Management

- **Storage**: Tokens are stored securely. Since we are using Next.js App Router, we use `@supabase/ssr` to manage cookies. The tokens are stored in `httpOnly` cookies via Server Actions/Route Handlers.
- **Duration**: JWT tokens expire in 1 hour by default, but the refresh token automatically extends the session up to the 30-day absolute limit (configured in Supabase dashboard).
- **Inactivity Timeout**: The frontend monitors user inactivity. After 30 minutes of idle time, a warning banner appears. If ignored, the client calls `supabase.auth.signOut()` and clears the cookies.

## 4. Admin Verification Flow

1. **Admin Dashboard**: Regional Admin or Super Admin logs in using Email/Password or Phone/PIN (with role `SUPER_ADMIN` in `admin_users`).
2. **Review Pending Profiles**: Admin reviews records in `user_profiles` with `PENDING_ADMIN_REVIEW`.
3. **Action**: 
   - Approve: Sets status to `APPROVED`. System triggers an Edge Function to send a welcome SMS.
   - Reject: Sets status to `REJECTED`, logging the reason in `id_documents.rejection_reason`. System triggers an SMS asking the user to re-upload.

## 5. Security & Edge Cases

- **Rate Limiting**: Built into Supabase Auth. Prevents OTP spam.
- **Forgot PIN**: 
  - User taps "Forgot PIN".
  - System falls back to `signInWithOtp` (SMS flow).
  - Once verified via OTP, user is allowed to call `updateUser({ password: 'new-pin' })`.
- **Changing Phone Number**:
  - Requires user to be logged in. 
  - User inputs new phone number.
  - System calls `updateUser({ phone: 'new-phone' })`. Supabase handles sending an OTP to the new number to verify ownership.
