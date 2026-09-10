Use for every row of the archive list. All 141 render directly; section headers group them by tier when unfiltered.

```jsx
<StationRow designator="S28" name="The Buzzer" operator="Russian military, 69th communications hub" tier="live" periodSec={2.4} onOpen={push} />
<StationRow designator="M13c" name="M13c" operator="Bulgaria" tier="historical" />
```

Never render a green "Active" pill — tier plus a dated `last confirmed` claim is how status is stated. Tapping pushes the full-screen detail, not a sheet.
