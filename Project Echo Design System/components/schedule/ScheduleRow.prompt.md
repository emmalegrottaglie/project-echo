Use for the schedule list, soonest first.

```jsx
<ScheduleRow
  designator="E11" name="Oblique"
  utc="Mon 03:15 UTC" local="Mon 04:15" countdown="in 18 h 31 m"
  khz={8102} note="ID 25. Frequency rotates monthly; 8102 kHz is the January listing."
  alertOn onToggleAlert={toggle}
/>
```

Times are published in UTC and shown in UTC first, local second. Keep the rotation caveat visible: a slot silent on the listed frequency may simply have moved. The countdown updates on a 30 s tick and must not animate on it.
