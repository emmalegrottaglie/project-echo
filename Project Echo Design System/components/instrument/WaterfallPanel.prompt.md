Use as the live view's centre, full bleed to both screen edges, directly above the detector strip.

```jsx
<WaterfallPanel rows={320} mock="detected" />
<WaterfallPanel mock="blank" />   {/* before the first row is painted */}
```

Square corners (`--radius-instrument: 0`) — the instrument is square, the interface is slightly soft. The colour ramp comes from `--wf-00`…`--wf-08` and is never themed: a hue ramp would make a mid-amplitude pulse read as louder than a strong one. Never put a decorative animation over it, never resize it mid-stream (that loses history), and never offer pinch-zoom — the visible span is fixed by the FFT and the row rate.
