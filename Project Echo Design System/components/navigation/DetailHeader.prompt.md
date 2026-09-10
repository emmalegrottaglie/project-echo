Use at the top of the full-screen station detail that pushes in from the trailing edge.

```jsx
<DetailHeader designator="S28" name="The Buzzer" tier="Live marker" onBack={pop} />
```

A ‹ chevron at 44px, not a labelled button — the edge-swipe back gesture is the primary route. Detail pushes translateX 100%→0 over `--dur-slow`; the gesture reverses it, interruptible and following the finger.
