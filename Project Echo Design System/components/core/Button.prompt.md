Use for every tappable control that is not a row, a tab or a switch — transport, sheet actions, header actions.

```jsx
<Button variant="primary" size="lg" full onClick={connect}>Connect</Button>
<Button onClick={playSynthetic}>Synthetic marker</Button>
<Button variant="ghost">Cancel</Button>
```

Variants: `primary` (accent border + 8% accent tint — the connect/stop control), `secondary` (panel + hairline, the default), `ghost` (transparent, dim label), `danger` (uses `--danger`, which is orange in the nightvision theme because the accent there is already red). Never animate its size: the transport control swaps its label by crossfade only, because a moving primary button under a thumb is a mis-tap.
