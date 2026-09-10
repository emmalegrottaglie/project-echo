Use as the phone-layout root navigation, pinned to the bottom above the safe-area inset. Three tabs, always these three.

```jsx
<TabBar value={tab} onChange={setTab} />
```

Uppercase 12px mono labels with a 2px accent rule and glow on the active tab. No icons: the source has no icon set, and inventing one would put unrecognisable glyphs in the most-used control. Switching views fades in and lifts 8px over `--dur-base`; the outgoing view fades without moving.
