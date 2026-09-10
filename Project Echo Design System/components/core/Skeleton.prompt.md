Use only in the receiver-directory sheet while the proxy fetch is in flight.

```jsx
{loading ? <Skeleton rows={3} /> : rows.map(...)}
```

Do not use it anywhere that shares a screen with a running waterfall — a looping shimmer is banned while audio is live, and this is one of two documented exceptions because the directory sheet is not open during streaming.
