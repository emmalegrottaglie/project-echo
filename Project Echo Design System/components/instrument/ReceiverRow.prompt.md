Use for the live view's top two rows: the selected receiver, then the tuned station and frequency. Tapping either opens its picker sheet.

```jsx
<ReceiverRow label="Receiver" value="Moscow region" meta="· KO85" onOpen={openReceivers} />
<ReceiverRow label="Station" value="S28 The Buzzer" meta="· 4625 kHz USB" live periodSec={2.4} onOpen={openStations} />
```

One line, truncating — an ENIGMA designator must never wrap mid-token. Disputed frequencies carry the `<Flag>` here as well as in the archive.
