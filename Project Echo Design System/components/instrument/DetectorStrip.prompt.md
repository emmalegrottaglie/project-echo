Use directly under the waterfall on the live view. It is the app's only interpretation of the signal, and the app must stay usable with the spectrogram invisible — so never drop it to save space.

```jsx
<DetectorStrip state="detected" periodSec={2.38} perMinute={25} expectedSec={2.4} />
<DetectorStrip state="searching" />
```

Wording is verbatim from `src/detector.ts`'s `describe()`. `searching → detected`: the scanning bar stops where it is, fades over 120 ms, and the confirmation scales in over 400 ms — nothing bounces. `detected → absent` must read differently from `detected → searching`: a marker that stopped is news, a marker whose timing got noisy is not. It is an `aria-live="polite"` region, so keep lines short and never repeat unchanged text.
