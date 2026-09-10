Use as the leading cell of every schedule row. One switch per slot, not per station.

```jsx
<AlertSwitch on={subscribed} onChange={toggle} />
<AlertSwitch on={false} disabled label="Notifications are blocked for this site" />
```

44px target around a 34×20 track. Disable it when permission is denied or the Notification API is missing, and say so in the coverage note rather than offering a switch that does nothing.
