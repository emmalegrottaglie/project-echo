Use in station detail to show every frequency a station has been reported on, with its own source and date.

```jsx
<ProvenanceTable rows={station.frequencies} />
```

Show all conflicting rows — S32 is published as both 5473/3828 kHz and 5367/3363.5 kHz, and the app lists both rather than picking one. Disputed rows read as "the sources disagree", never as a validation error.
