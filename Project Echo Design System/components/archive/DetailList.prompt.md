Use at the top of a station detail, before the lore paragraph.

```jsx
<DetailList items={[
  { label: 'Classification', value: 'Slavic voice' },
  { label: 'Operator', value: 'Russian military, 69th communications hub' },
  { label: 'Status', value: 'Live marker, last confirmed 2025-11-15' },
  { label: 'Marker', value: '~1.2 s buzz tone, repeating ~25 times per minute' },
]} />
```

Status is always a dated claim in this list. "never confirmed" is the honest value when no date exists — not a blank.
