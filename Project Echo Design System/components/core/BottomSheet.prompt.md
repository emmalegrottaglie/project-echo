Use for the three pickers: receiver, station, and the receiver directory. Never for station detail — that is a full-screen push, because the detail carries provenance tables.

```jsx
<BottomSheet
  title="Public receivers"
  note="Showing 50 of 776 receivers covering 4625 kHz with a free channel. Source: rx.linkfanel.net."
  onDismiss={close}
>
  {rows}
</BottomSheet>
```

Presents by translateY 100%→0 over `--dur-slow`; the scrim fades over `--dur-base`. The scrim uses `--overlay` at 72% and must not fully hide the waterfall. Drag-to-dismiss tracks the finger 1:1 in the real app.
