# Google Maps setup (GuardIon)

## Where API keys go

Keys are **not** committed to git. They are read at **build / prebuild** time from environment variables and written into native config by Expo as **`android.config.googleMaps.apiKey`** and **`ios.config.googleMapsApiKey`** (see Expo MapView docs).

1. Copy `.env.example` to `.env` in the **`guardIon`** project root (same folder as `package.json`).
2. Set either:
   - **`GOOGLE_MAPS_ANDROID_API_KEY`** — restricted Android Maps SDK key (`android.package`, SHA-1).
   - **`GOOGLE_MAPS_IOS_API_KEY`** — restricted iOS Maps SDK key (`ios.bundleIdentifier`).
   - Or a single **`GOOGLE_MAPS_API_KEY`** for local experiments only (both platforms read it if the platform-specific vars are empty).

The wiring lives in **`app.config.js`**, which merges **`app.json`** and sets those `android` / `ios` `config` fields from your `.env`.

Static app metadata stays in **`app.json`**; **`app.config.js`** merges onto it.

## Identifiers must match Google Cloud

Default identifiers are set in **`app.config.js`**:

- Android: **`com.guardion.app`** (`android.package`)
- iOS: **`com.guardion.app`** (`ios.bundleIdentifier`)

Change these if your Play Console / App Store IDs differ; update Google key restrictions to match.

## After changing keys or identifiers

Rebuild native binaries (keys are baked into native config):

```bash
cd guardIon
npx expo prebuild --clean
npx expo run:android
# or
npx expo run:ios
```

Expo Go includes Maps for quick tries; production-like behavior uses dev builds / `run:*` as above.

## Code

The Map tab uses **`react-native-maps`** with **`provider={PROVIDER_GOOGLE}`** in `app/(tabs)/map.tsx`.
