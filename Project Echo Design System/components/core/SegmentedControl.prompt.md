Use for the archive's tier filter, and nothing else — it is the app's only segmented control.

```jsx
<SegmentedControl
  value={tier}
  onChange={setTier}
  options={[
    { value: '', label: 'All' },
    { value: 'live', label: 'Live' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'historical', label: 'Historical' },
  ]}
/>
```

Labels are uppercase mono at 12px. The selected segment is accent text on an 8% accent tint, not a filled pill — filled accent would compete with the live pulse.
