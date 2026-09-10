Use pinned directly above the tab bar on the live view, never in the scrolling flow.

```jsx
<TransportBar running={running} onConnect={connect} onStop={stop} onSynthetic={synth} />
```

The primary control keeps the same box in both roles and crossfades its label over `--dur-fast` — a primary button that moves under a thumb is a mis-tap. Respects the bottom safe-area inset. Controls that need the Phase 3 server hide rather than fail.
