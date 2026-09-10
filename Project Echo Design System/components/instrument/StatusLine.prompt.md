Use once per live view, above the waterfall. Carries connect progress and every audio failure.

```jsx
<StatusLine message="running — Moscow region · KO85" tone="live" />
<StatusLine
  tone="danger"
  message="connected but no audio reached the analyser — the receiver may have all channels busy"
  action={<Button variant="ghost">Try another receiver</Button>}
/>
```

A 2px left rail carries the tone; the ground stays `--panel`. Failures must say which failure it is and offer the action, because a stalled stream and a dead antenna look identical and neither throws.
