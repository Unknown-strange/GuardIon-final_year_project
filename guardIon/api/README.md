# GuardIon API Integration

All backend integration lives in this folder. Each file maps to a backend resource and uses the same field names as the FastAPI schemas.

## Structure

| File | Backend routes |
|------|----------------|
| `client.ts` | Shared fetch wrapper (auth header, errors, ngrok header) |
| `config.ts` | `EXPO_PUBLIC_API_URL`, `OTP_LENGTH` |
| `errors.ts` | `ApiError`, `getErrorMessage` |
| `types.ts` | Request/response types (snake_case, matches Pydantic) |
| `auth.ts` | `/auth/*` |
| `users.ts` | `/users/me` |
| `children.ts` | `/children/*` |
| `devices.ts` | `/devices/*` |
| `locations.ts` | `/locations/*` |
| `safezones.ts` | `/safezones/*` |
| `alerts.ts` | `/alerts/*` |
| `notifications.ts` | `/notifications/*` |
| `mappers.ts` | API types → UI types (`ChildSummary`, `SafeZone`, `AlertItem`) |

## Field mapping (frontend form → API)

### Child
| UI (register/edit) | API |
|--------------------|-----|
| `firstName` + `lastName` | `name` |
| `dateOfBirth` | `age` (computed) |
| `avatarUri` | `profile_photo` |
| `deviceId` | `POST /devices/register` → `device_id` + `child_id` |

### Safe zone
| UI | API |
|----|-----|
| `name` | `zone_name` |
| `latitude` | `center_lat` |
| `longitude` | `center_lng` |
| `radiusM` | `radius` |
| `childId` | `child_id` |

### User profile
| UI | API |
|----|-----|
| `name` | `name` |
| `phoneNumber` | `phone_number` |

## Still local-only (no backend yet)
- Guardians
- Emergency contacts (account + per-child)
- Logged-in devices
- Notification preference toggles
- Check-in simulation

## Usage

```ts
import { createChild, listChildren } from '@/api/children';
import { useGuardianData } from '@/contexts/guardian-data-context';
```

Legacy imports from `@/lib/api/*` re-export from `@/api/*`.
