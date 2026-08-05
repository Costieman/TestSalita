# Upgrade from Salita Quest v3.2 without losing progress

## Safest method

1. Open your existing v3.2 app.
2. Go to **Settings**.
3. Select **Export progress**.
4. Keep the downloaded JSON file.
5. Extract the v4.1 Mobile ZIP into a new folder.
6. Open v4.1 Mobile and go to **Settings**.
7. Select **Import progress backup**.
8. Choose the JSON file exported from v3.2.

Your XP, streak, coins, mastery levels, review intervals, due dates, and item history will be migrated.

## Automatic migration

When v3.2 and v4.1 Mobile are opened from the same web origin, for example both through `http://127.0.0.1:8000`, v4.1 Mobile checks the old `salitaQuestStateV3` browser-storage key and imports it automatically.

Opening separate `index.html` files directly can cause browsers to isolate storage by file location. Therefore, export/import is recommended whenever you change folders or devices.

## Future versions

Version 4 saves progress under the stable key `salitaQuestProgress` and exports a versioned package with stable item IDs. Future versions should continue to read this key and preserve existing IDs.
