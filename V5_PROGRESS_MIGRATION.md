# v4.2 → v5 progress migration

1. In v4.2, open **Settings → Download progress backup**.
2. Open v5.
3. In **Settings → Import progress backup**, choose that JSON file.
4. v5 keeps the current mastery value for spaced repetition and creates a permanent `peakMastery` value for world unlocking.
5. Future incorrect answers may lower current mastery, but `peakMastery` never decreases, so an earned region does not lock again.

The original stable item IDs are retained. Unknown item records are retained by the migration logic as well.
