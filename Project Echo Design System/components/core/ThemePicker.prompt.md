Use in the app header, as the only control there besides the app name.

```jsx
<ThemePicker value={theme} onChange={(t) => (document.documentElement.dataset.theme = t)} />
```

Four 44px targets holding 12px dots in each theme's accent. Applying a theme sets `data-theme` on `<html>` and must not transition — see motion item 14.
