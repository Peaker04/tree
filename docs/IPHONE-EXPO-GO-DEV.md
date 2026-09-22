# iPhone Expo Go Development

## A. Prerequisites
- Windows PC
- Physical iPhone
- PC and iPhone must be on the same Wi-Fi / LAN network.
- Expo Go installed on the iPhone
- Expo account logged in

## B. Startup
From the respiratory root, run:
```bash
npm run mobile:start:ios:go
```

## C. iPhone
- Open Expo Go.
- Scan the QR code shown in the Windows terminal or open the iPhone Camera to scan and route into Expo Go.

## D. Expected
- NOVYX GreenOps mobile app loads.
- No red error screens.
- Fast Refresh works.

## E. Fast-Refresh Test
1. Change one harmless text locally in `apps/mobile/src/screens/MobileApp.tsx` (e.g. temporary smoke text).
2. Save the file.
3. Observe the update on the iPhone.
4. Revert the text.

## F. Real Backend Later
To fully exercise real API workflows (e.g. R2A testing):
1. Run `ipconfig` in Windows terminal to obtain your Windows IPv4 address on the Wi-Fi adapter.
2. Set the local untracked `.env` variables (do not modify `.env.example` directly):
```env
EXPO_PUBLIC_DATA_SOURCE=rest
EXPO_PUBLIC_API_BASE_URL=http://<WINDOWS_IPV4>:3000
```
3. Restart Metro with cache cleared (`npx expo start --go --clear`) so the environment variables inject into the JS bundle payload safely over the local network. Make sure Fastify API is bound to `0.0.0.0` or `<WINDOWS_IPV4>`.

## G. Troubleshooting
- **LAN Failure**: `npx expo start --go --tunnel`
- **Wrong runtime target**: Ensure `--go` flag is supplied.
- **Stale Metro**: Restart with `--clear`.
- **iPhone cannot reach backend**: Check same Wi-Fi network, check Windows Firewall rules preventing port 3000/8082, ensure API host is `0.0.0.0` instead of `localhost`, verify LAN IP correctness.
