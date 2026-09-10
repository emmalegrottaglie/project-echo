Use on live-tier station rows and on the live view's receiver row. Nowhere else — a pulse that is not a transmitter's pulse is decoration, and decoration does not loop in this app.

```jsx
<LivePulse periodSec={station.markerPeriodSec ?? 2.4} />
```

Never scale it, only fade it. Under `prefers-reduced-motion` it becomes a solid dot. Pair it with a word or glyph: colour alone may not carry the tier.
