# assets/

**Fonts only.** `assets/fonts/` holds five self-hosted JetBrains Mono woff2 files
(regular, medium, semibold, bold, italic), declared in `tokens/fonts.css`. Everything
else below is absent, on purpose.

`numberstationsApp` contains no image, icon or font binaries of any kind — no logo, no
favicon, no SVG set, no icon font, no webfont files. The only binary assets in the
repository are `server/diagnostic/marker.wav` (a generated 30-second Buzzer-shaped test
recording used to prove the CORS-silence check) and `server/data/echo.sqlite`, neither
of which is a design asset.

Nothing has been drawn to fill the gap:

- **Logo.** There is none. The wordmark is the name "PROJECT ECHO" set in uppercase
  mono, accent colour, 0.08em tracking. See `guidelines/brand-wordmark.card.html`.
  Drawing a mark would also risk implying affiliation with an intelligence service,
  which `MOBILE_UI_SPEC.md` §11 forbids outright.
- **Icons.** There is no icon set. The app's entire glyph vocabulary is unicode
  characters rendered in the mono face — see `guidelines/brand-glyphs.card.html`.
- **Fonts.** JetBrains Mono is named in `src/style.css` but not shipped by the repo. It
  is self-hosted here in `assets/fonts/`, supplied by the team — five static woff2
  weights, no CDN, no third-party request per load. SIL OFL 1.1; keep `OFL.txt` beside
  the binaries.
- **Imagery.** The app has no photography or illustration. Its one full-bleed visual is
  the spectrogram, which is generated from live audio, and the propagation map, which is
  an image fetched from prop.kc2g.com at runtime.
