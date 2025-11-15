# app_front_heal

## Configure API base URL

This app reads its API base URL from the Expo public env variable `EXPO_PUBLIC_API_BASE_URL`.

If not provided, it falls back to the value in `src/services/api.ts`.

Valid examples:

- Android emulator: `http://10.0.2.2:8080/api`
- iOS simulator (macOS): `http://localhost:8080/api`
- Physical device on same LAN: `http://<YOUR-PC-LAN-IP>:8080/api`
- Dev tunnel: `https://<your-tunnel>.devtunnels.ms/api`

### Quick setup (Windows PowerShell)

Set the env var for the current terminal session, then start Expo:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8080/api"  # or your LAN IP / tunnel
npm run start
```

To persist across sessions (optional):

```powershell
setx EXPO_PUBLIC_API_BASE_URL "http://10.0.2.2:8080/api"
# Close and reopen your terminal for the change to take effect
```

## Android map fallback (release builds)

If the map view causes a black/blank screen on Android release builds, you can disable the map and use list mode only by setting:

```powershell
$env:EXPO_PUBLIC_DISABLE_MAP = "1"
npm run start
```

The Home screen will show a graceful fallback and an "Open Doctors List" button.

## Configure API base URL

This app reads its API base URL from the Expo public env variable `EXPO_PUBLIC_API_BASE_URL`.

If not provided, it falls back to a dev tunnel URL hardcoded in `src/services/api.ts`.

Valid examples:

- Android emulator: `http://10.0.2.2:8080/api`
- iOS simulator (macOS): `http://localhost:8080/api`
- Physical device on same LAN: `http://<YOUR-PC-LAN-IP>:8080/api`
- Dev tunnel: `https://<your-tunnel>.devtunnels.ms/api`

### Quick setup (Windows PowerShell)

Set the env var for the current terminal session, then start Expo:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8080/api"  # or your LAN IP / tunnel
npm run start
```

To persist across sessions (optional):

```powershell
setx EXPO_PUBLIC_API_BASE_URL "http://10.0.2.2:8080/api"
# Close and reopen your terminal for the change to take effect
```

## Android: Maps crash or blank screen (release builds)

On Android production builds, `react-native-maps` requires a Google Maps API key. In Expo dev (Expo Go), a key is bundled so it works; in your standalone build, you must configure it.

Fix options:

- Recommended: Add a Google Maps API key in `app.json` and rebuild:

	Add under `expo.android.config`:

	```json
	{
		"expo": {
			"android": {
				"config": {
					"googleMaps": { "apiKey": "YOUR_GOOGLE_MAPS_API_KEY" }
				}
			},
			"plugins": [
				["react-native-maps"],
				["expo-location", { "locationAlwaysAndWhenInUsePermission": "Allow HealthConnect to use your location…" }]
			]
		}
	}
	```

- Temporary workaround (no native rebuild): disable map rendering and use list mode only:

	```powershell
	$env:EXPO_PUBLIC_DISABLE_MAP = "1"
	npm run start
	```

The Home screen will show a fallback and an "Open Doctors List" button.
