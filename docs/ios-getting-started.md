# Foxon iOS — Getting Started (zero-to-iPhone guide)

You've never built an iOS app — this is the complete path from nothing to Foxon running on your iPhone.

## 1. One-time Mac setup

1. **Install Xcode** from the Mac App Store (search "Xcode"). It's ~12 GB, takes a while.
2. Open Xcode once after installing — accept the license and let it "install components".
3. In Xcode → **Settings → Components** (or Platforms), make sure an **iOS Simulator runtime** is installed (it usually is by default).
4. That's it. No Apple Developer account needed yet.

## 2. Run the app in the iOS Simulator

```bash
cd mobile
npx expo run:ios
```

- First run compiles the native project (~5–10 min). After that it's fast.
- A simulator iPhone boots and Foxon launches. The dev server (Metro) runs in your terminal — leave it running; code changes hot-reload.
- The app talks to the backend at `EXPO_PUBLIC_API_URL` in `mobile/.env`. Default is `http://localhost:3000`, so **have the web dev server running** (`npm run dev` at the repo root), or point it at your production Vercel URL instead.
- Sign in with the same account you use on the web.

Useful simulator tricks:
- `Cmd+D` in the simulator → developer menu (reload, etc.)
- `Cmd+Shift+H` → home screen. Device → "Erase All Content" if things ever get weird.

## 3. Run on your real iPhone — free (no paid account)

1. Plug your iPhone into the Mac with a cable. Tap **"Trust this computer"** on the phone.
2. On the iPhone: **Settings → Privacy & Security → Developer Mode → on** (phone restarts). This option appears after the first install attempt if you don't see it yet.
3. Run:
   ```bash
   cd mobile
   npx expo run:ios --device
   ```
   Pick your iPhone from the list.
4. The first time, Xcode needs a signing identity:
   - Open `mobile/ios/Foxon.xcworkspace` in Xcode once,
   - select the **Foxon** target → **Signing & Capabilities**,
   - check "Automatically manage signing", and under **Team**, add your personal Apple ID (Xcode → Settings → Accounts → "+").
   - This creates a free **"Personal Team"** certificate.
5. On the iPhone: **Settings → General → VPN & Device Management** → trust your developer certificate.
6. The app installs and runs like a normal app.

⚠️ Free-account limitation: the app signature **expires after 7 days**. The app stops launching until you re-run `npx expo run:ios --device` from your Mac. Fine for the trial period.

**Important for the phone**: your iPhone can't reach `localhost` on your Mac. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to either:
- your deployed Vercel URL (recommended — real data), or
- your Mac's LAN IP, e.g. `http://192.168.1.x:3000`, if you want to test against the local dev server (same Wi-Fi network).

After changing `.env`, restart the dev server (`npx expo start --clear` or re-run the build).

## 4. When you're ready to commit ($99/year, recommended once the app sticks)

Join the [Apple Developer Program](https://developer.apple.com/programs/). What it buys you:
- **TestFlight**: install/update the app over the air, no cable, no Mac needed for updates. Builds last 90 days.
- Signing that doesn't expire weekly.
- Required later for distributing the **Apple Watch** companion app.

Then the easiest pipeline is **EAS Build** (Expo's cloud build service, free tier is fine):
```bash
npm install -g eas-cli
cd mobile
eas login          # create a free Expo account if needed
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios   # uploads to TestFlight
```
EAS walks you through Apple credentials interactively — it automates certificates/profiles, the most painful part of iOS development.

## 5. Day-to-day development

| What | Command |
|---|---|
| Start dev (simulator) | `cd mobile && npx expo run:ios` (or `npx expo start` if the dev build is already installed) |
| Run on iPhone | `npx expo run:ios --device` |
| Typecheck | `cd mobile && npx tsc --noEmit` |
| Lint | `cd mobile && npm run lint` |
| Web app (backend for the iOS app) | `npm run dev` at repo root |

## 6. Troubleshooting

- **"No script URL provided" / red error screen**: Metro isn't running — `cd mobile && npx expo start`, then relaunch the app.
- **Network request failed on simulator**: the web dev server isn't running on :3000, or `EXPO_PUBLIC_API_URL` points to the wrong place.
- **401 errors**: sign out and back in (token expired mid-session is auto-refreshed, but a revoked session isn't).
- **Build fails after `npm install`**: `cd mobile/ios && pod install` (CocoaPods sync), or `npx expo run:ios` again — it re-syncs pods automatically.
- **Stale native build after adding a native dependency**: `npx expo run:ios` (not just `expo start`) to rebuild the dev client.
