# Auth & OTP Setup

## Backend

1. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `RESEND_API_KEY` (from [resend.com](https://resend.com))
   - `RESEND_FROM_EMAIL` (must be a verified sender/domain in Resend)

2. Run migration:
   ```bash
   cd backend_guardion
   alembic upgrade head
   ```

3. Start API:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Dev without Resend:** leave `RESEND_API_KEY` empty — OTP codes are logged to the console when `DEBUG=true`.

## OTP email

Branded HTML template lives in `app/services/email_templates.py` and is sent via Resend in `app/services/email_service.py`.

## Auth endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/auth/signup/request` | Start signup, send OTP |
| `POST /api/v1/auth/signup/verify` | Verify OTP, create account, return JWT |
| `POST /api/v1/auth/forgot-password` | Send password reset OTP |
| `POST /api/v1/auth/reset-password` | Verify OTP + set new password |
| `POST /api/v1/auth/resend-otp` | Resend OTP (`purpose`: `signup` \| `password_reset`) |
| `POST /api/v1/auth/login` | Sign in |

## Frontend

Set in `guardIon/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api/v1
```

Use `10.0.2.2` for Android emulator, your LAN IP for a physical phone.

Auth flow screens wired to the API:
- Sign up → Verify OTP → Home
- Forgot password → Verify OTP → Reset password → Sign in
