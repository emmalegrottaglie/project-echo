/* @ds-bundle: {"format":4,"namespace":"ProjectEchoDesignSystem_453425","components":[{"name":"DetailList","sourcePath":"components/archive/DetailList.jsx"},{"name":"Flag","sourcePath":"components/archive/Flag.jsx"},{"name":"GapNotice","sourcePath":"components/archive/GapNotice.jsx"},{"name":"ProvenanceTable","sourcePath":"components/archive/ProvenanceTable.jsx"},{"name":"StationRow","sourcePath":"components/archive/StationRow.jsx"},{"name":"TierHeader","sourcePath":"components/archive/TierHeader.jsx"},{"name":"BottomSheet","sourcePath":"components/core/BottomSheet.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"SearchField","sourcePath":"components/core/SearchField.jsx"},{"name":"SegmentedControl","sourcePath":"components/core/SegmentedControl.jsx"},{"name":"Skeleton","sourcePath":"components/core/Skeleton.jsx"},{"name":"ThemePicker","sourcePath":"components/core/ThemePicker.jsx"},{"name":"DetectorStrip","sourcePath":"components/instrument/DetectorStrip.jsx"},{"name":"LivePulse","sourcePath":"components/instrument/LivePulse.jsx"},{"name":"ReceiverRow","sourcePath":"components/instrument/ReceiverRow.jsx"},{"name":"StatusLine","sourcePath":"components/instrument/StatusLine.jsx"},{"name":"TransportBar","sourcePath":"components/instrument/TransportBar.jsx"},{"name":"WaterfallPanel","sourcePath":"components/instrument/WaterfallPanel.jsx"},{"name":"AppHeader","sourcePath":"components/navigation/AppHeader.jsx"},{"name":"DetailHeader","sourcePath":"components/navigation/DetailHeader.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"DirectoryRow","sourcePath":"components/receiver/DirectoryRow.jsx"},{"name":"AlertSwitch","sourcePath":"components/schedule/AlertSwitch.jsx"},{"name":"CoverageNote","sourcePath":"components/schedule/CoverageNote.jsx"},{"name":"ScheduleRow","sourcePath":"components/schedule/ScheduleRow.jsx"}],"sourceHashes":{"components/archive/DetailList.jsx":"a41a047dc5aa","components/archive/Flag.jsx":"88a0ba7393c6","components/archive/GapNotice.jsx":"c2c8a09a9e48","components/archive/ProvenanceTable.jsx":"2c5347b026c3","components/archive/StationRow.jsx":"85cb999d53d4","components/archive/TierHeader.jsx":"8d9fd7072d9d","components/core/BottomSheet.jsx":"234fe435e604","components/core/Button.jsx":"8eaf00694cca","components/core/SearchField.jsx":"498837bef3ea","components/core/SegmentedControl.jsx":"b6e6d0094867","components/core/Skeleton.jsx":"827af7e79661","components/core/ThemePicker.jsx":"97cc49e9a1f1","components/instrument/DetectorStrip.jsx":"d4f813834401","components/instrument/LivePulse.jsx":"8e54882ff35c","components/instrument/ReceiverRow.jsx":"fbce3f1a1abe","components/instrument/StatusLine.jsx":"bdfb7a8f7743","components/instrument/TransportBar.jsx":"faae3f9243f2","components/instrument/WaterfallPanel.jsx":"41aa5a701f0f","components/navigation/AppHeader.jsx":"4ace33540341","components/navigation/DetailHeader.jsx":"56e34bacc910","components/navigation/TabBar.jsx":"58951c5638e4","components/receiver/DirectoryRow.jsx":"dcbbbc840f31","components/schedule/AlertSwitch.jsx":"4ce2726dc937","components/schedule/CoverageNote.jsx":"f65c8dcbf3f6","components/schedule/ScheduleRow.jsx":"6b01e4a8407a","ui_kits/echo-mobile/App.jsx":"8699767f50be","ui_kits/echo-mobile/ArchiveScreen.jsx":"0ef05991da70","ui_kits/echo-mobile/LiveScreen.jsx":"e18576ba2869","ui_kits/echo-mobile/ScheduleScreen.jsx":"fa5d990d9aba","ui_kits/echo-mobile/Sheets.jsx":"abc2b50520e0","ui_kits/echo-mobile/StationDetail.jsx":"6bfe0f80c86c","ui_kits/echo-mobile/data.js":"44d117c545d6"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ProjectEchoDesignSystem_453425 = window.ProjectEchoDesignSystem_453425 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/archive/DetailList.jsx
try { (() => {
/**
 * The detail view's definition list: classification, operator, dated status, marker,
 * aliases. Uppercase 12px labels against mono values.
 */
function DetailList({
  items
}) {
  return /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'max-content 1fr',
      gap: 'var(--space-2) var(--space-4)',
      margin: 0
    }
  }, items.map(item => /*#__PURE__*/React.createElement(React.Fragment, {
    key: item.label
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, item.label), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-body) var(--font-mono)`
    }
  }, item.value))));
}
Object.assign(__ds_scope, { DetailList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/DetailList.jsx", error: String((e && e.message) || e) }); }

// components/archive/Flag.jsx
try { (() => {
/**
 * A short uppercase word carrying a data caveat: disputed, not imported, never
 * confirmed. No meaning in this app is carried by colour alone, so the flag is always
 * a word.
 */
function Flag({
  tone = 'accent',
  children
}) {
  const color = {
    accent: 'var(--accent)',
    dim: 'var(--dim)',
    danger: 'var(--danger)',
    ok: 'var(--ok)'
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      color,
      font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, children);
}
Object.assign(__ds_scope, { Flag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/Flag.jsx", error: String((e && e.message) || e) }); }

// components/archive/GapNotice.jsx
try { (() => {
/**
 * An honest gap. 112 of 141 stations have sourced identity and status but no imported
 * detail, several views have no data yet, and three features vanish without the
 * server. All of those read as a stated gap with a route onward, never as a broken
 * page and never as an empty table.
 */
function GapNotice({
  title,
  children,
  links = []
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--space-4)',
      border: 'var(--hairline-width) solid var(--border)',
      borderRadius: 'var(--radius-control)',
      background: 'var(--panel)'
    }
  }, title && /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 var(--space-2)',
      color: 'var(--dim)',
      font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-body) var(--font-sans)`,
      maxWidth: '60ch',
      textWrap: 'pretty'
    }
  }, children), links.length > 0 && /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 'var(--space-3) 0 0',
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, links.map(link => /*#__PURE__*/React.createElement("li", {
    key: link.url
  }, /*#__PURE__*/React.createElement("a", {
    href: link.url,
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: 'var(--accent)',
      font: `var(--text-body)/var(--leading-body) var(--font-mono)`
    }
  }, link.label), link.description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`
    }
  }, link.description)))));
}
Object.assign(__ds_scope, { GapNotice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/GapNotice.jsx", error: String((e && e.message) || e) }); }

// components/archive/ProvenanceTable.jsx
try { (() => {
/**
 * Frequency provenance. No frequency is stored as a bare constant: each row carries
 * its own source and confirmation date, and a disputed flag where sources conflict.
 * Disputed rows get an 8% accent wash plus the word — colour never carries it alone.
 */
function ProvenanceTable({
  rows
}) {
  const cell = {
    padding: 'var(--space-2) var(--space-2) var(--space-2) 0',
    borderBottom: 'var(--hairline-width) solid var(--border)',
    verticalAlign: 'top'
  };
  const head = {
    ...cell,
    color: 'var(--dim)',
    font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
    letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase',
    textAlign: 'left'
  };
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      font: `var(--text-body)/var(--leading-data) var(--font-mono)`,
      color: 'var(--fg)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: head
  }, "kHz"), /*#__PURE__*/React.createElement("th", {
    style: head
  }, "Mode"), /*#__PURE__*/React.createElement("th", {
    style: head
  }, "When"), /*#__PURE__*/React.createElement("th", {
    style: head
  }, "Last confirmed"), /*#__PURE__*/React.createElement("th", {
    style: head
  }, "Source"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, index) => /*#__PURE__*/React.createElement("tr", {
    key: index,
    style: row.disputed ? {
      background: 'var(--tint-accent-weak)'
    } : undefined
  }, /*#__PURE__*/React.createElement("td", {
    style: cell
  }, row.khz), /*#__PURE__*/React.createElement("td", {
    style: cell
  }, row.mode), /*#__PURE__*/React.createElement("td", {
    style: cell
  }, row.timeOfDay || '—'), /*#__PURE__*/React.createElement("td", {
    style: cell
  }, row.lastConfirmed), /*#__PURE__*/React.createElement("td", {
    style: cell
  }, /*#__PURE__*/React.createElement("a", {
    href: row.sourceUrl,
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: 'var(--accent)'
    }
  }, "source"), row.disputed && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement(__ds_scope.Flag, null, "disputed")))))));
}
Object.assign(__ds_scope, { ProvenanceTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/ProvenanceTable.jsx", error: String((e && e.message) || e) }); }

// components/archive/TierHeader.jsx
try { (() => {
/** Sticky section header grouping the archive by tier when no filter is applied. */
function TierHeader({
  label,
  count
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 'var(--space-2)',
      padding: 'var(--space-2) var(--space-4)',
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: 'var(--panel)',
      color: 'var(--dim)',
      font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), count != null && /*#__PURE__*/React.createElement("span", null, count));
}
Object.assign(__ds_scope, { TierHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/TierHeader.jsx", error: String((e && e.message) || e) }); }

// components/core/BottomSheet.jsx
try { (() => {
/**
 * Bottom sheet: receiver picker, station picker, directory browser (MOBILE_UI_SPEC §4.4).
 * 90% max height, drag handle, swipe-to-dismiss, scrim in --overlay — the scrim is
 * deliberately translucent so the waterfall stays visible behind it.
 */
function BottomSheet({
  open = true,
  title,
  note,
  onDismiss,
  children,
  height = '90%'
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onDismiss,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--overlay)',
      animation: 'echo-fade-in var(--dur-base) var(--ease-out) both'
    }
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      maxHeight: height,
      display: 'flex',
      flexDirection: 'column',
      borderTop: 'var(--hairline-width) solid var(--border)',
      borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
      background: 'var(--surface-elevated)',
      animation: 'echo-sheet-in var(--dur-slow) var(--ease-out) both',
      paddingBottom: 'var(--safe-bottom)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: 'var(--space-2) 0 var(--space-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border)'
    }
  })), title && /*#__PURE__*/React.createElement("header", {
    style: {
      padding: 'var(--space-2) var(--space-4) var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      color: 'var(--accent)',
      font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-title)'
    }
  }, title), note && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-2) 0 0',
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`
    }
  }, note)), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      padding: '0 var(--space-4) var(--space-4)'
    }
  }, children)), /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes echo-sheet-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-sheet-in { from { opacity: 0 } to { opacity: 1 } }
        }
      `));
}
Object.assign(__ds_scope, { BottomSheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/BottomSheet.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The app's one button. Primary and secondary are the transport controls from
 * MOBILE_UI_SPEC §4.1.5; ghost is the header/inline variant.
 *
 * The transport control must not resize when it swaps role (motion item 8), so every
 * variant keeps the same box and only the label crossfades.
 */
function Button({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  full = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const pad = size === 'lg' ? '0 var(--space-4)' : '0 var(--space-3)';
  const height = size === 'lg' ? 48 : 44;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    minHeight: height,
    minWidth: height,
    padding: pad,
    border: 'var(--hairline-width) solid var(--border)',
    borderRadius: 'var(--radius-control)',
    background: 'var(--panel)',
    color: 'var(--fg)',
    font: `var(--weight-medium) var(--text-body)/var(--leading-tight) var(--font-mono)`,
    letterSpacing: 'var(--tracking-title)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    width: full ? '100%' : undefined,
    transition: `opacity var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent'
  };
  const variants = {
    primary: {
      borderColor: 'var(--accent)',
      color: 'var(--accent)',
      background: 'var(--tint-accent-weak)'
    },
    secondary: {},
    ghost: {
      borderColor: 'transparent',
      background: 'transparent',
      color: 'var(--dim)'
    },
    danger: {
      borderColor: 'var(--danger)',
      color: 'var(--danger)',
      background: 'transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/SearchField.jsx
try { (() => {
/** Sticky search for the archive. Placeholder copy is the app's: sentence case, no period. */
function SearchField({
  value,
  onChange,
  placeholder = 'Search designator, name or operator',
  style
}) {
  return /*#__PURE__*/React.createElement("input", {
    type: "search",
    value: value,
    placeholder: placeholder,
    onChange: event => onChange && onChange(event.target.value),
    style: {
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: '0 var(--space-3)',
      border: 'var(--hairline-width) solid var(--border)',
      borderRadius: 'var(--radius-control)',
      background: 'var(--panel)',
      color: 'var(--fg)',
      font: `var(--weight-regular) var(--text-body)/var(--leading-tight) var(--font-mono)`,
      outlineOffset: 2,
      ...style
    }
  });
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedControl.jsx
try { (() => {
/** The archive's tier filter (MOBILE_UI_SPEC §4.3): All / Live / Scheduled / Historical. */
function SegmentedControl({
  options,
  value,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: '1fr',
      gap: 'var(--hairline-width)',
      padding: 'var(--hairline-width)',
      border: 'var(--hairline-width) solid var(--border)',
      borderRadius: 'var(--radius-control)',
      background: 'var(--panel)',
      ...style
    }
  }, options.map(option => {
    const on = option.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: option.value,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onClick: () => onChange && onChange(option.value),
      style: {
        minHeight: 36,
        padding: '0 var(--space-2)',
        border: 0,
        borderRadius: 2,
        background: on ? 'var(--tint-accent-weak)' : 'transparent',
        color: on ? 'var(--accent)' : 'var(--dim)',
        font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'color var(--dur-fast) var(--ease-out)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, option.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/core/Skeleton.jsx
try { (() => {
/**
 * Directory-load placeholder (motion item 13). Three rows, opacity 0.4→0.7, 900ms,
 * looping only while fetching — and audio is not streaming while the directory sheet
 * is open in the normal flow.
 */
function Skeleton({
  rows = 3
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--hairline-width)'
    }
  }, Array.from({
    length: rows
  }).map((_, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    style: {
      height: 56,
      borderBottom: 'var(--hairline-width) solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '62%',
      height: 10,
      background: 'var(--border)',
      animation: 'echo-skeleton var(--dur-skeleton) var(--ease-inout) infinite'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '34%',
      height: 8,
      background: 'var(--border)',
      animation: 'echo-skeleton var(--dur-skeleton) var(--ease-inout) infinite'
    }
  }))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-skeleton { 0%,100% { opacity: .4 } 50% { opacity: .7 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-skeleton { 0%,100% { opacity: .55 } 50% { opacity: .55 } }
        }
      `));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/core/ThemePicker.jsx
try { (() => {
const THEMES = [{
  value: 'phosphor',
  label: 'phosphor',
  swatch: '#4ade80'
}, {
  value: 'amber',
  label: 'amber',
  swatch: '#fbbf24'
}, {
  value: 'midnight',
  label: 'midnight',
  swatch: '#38bdf8'
}, {
  value: 'nightvision',
  label: 'nightvision',
  swatch: '#f87171'
}];

/**
 * Theme control. Changing theme is instant and explicitly has no transition
 * (motion item 14): a 300 ms recolour of every surface is a full-page repaint and it
 * fights the waterfall.
 */
function ThemePicker({
  value = 'phosphor',
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    "aria-label": "Theme",
    style: {
      display: 'flex',
      gap: 'var(--space-1)',
      ...style
    }
  }, THEMES.map(theme => {
    const on = theme.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: theme.value,
      type: "button",
      role: "radio",
      "aria-checked": on,
      "aria-label": theme.label,
      onClick: () => onChange && onChange(theme.value),
      style: {
        width: 'var(--touch-min)',
        height: 'var(--touch-min)',
        display: 'grid',
        placeItems: 'center',
        border: `var(--hairline-width) solid ${on ? 'var(--accent)' : 'transparent'}`,
        borderRadius: 'var(--radius-control)',
        background: 'transparent',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: theme.swatch,
        boxShadow: on ? `0 0 8px ${theme.swatch}66` : 'none'
      }
    }));
  }));
}
Object.assign(__ds_scope, { ThemePicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ThemePicker.jsx", error: String((e && e.message) || e) }); }

// components/instrument/DetectorStrip.jsx
try { (() => {
/**
 * The one piece of live interpretation on the screen, and what makes the app usable by
 * someone who cannot see the spectrogram at all (MOBILE_UI_SPEC §5.5, §8).
 *
 * Four states. searching runs the only permitted loop while streaming: a 24px accent
 * bar crossing a 2px strip. detected fires its scale-in once, then holds still — this
 * is an instrument reporting a lock, not a game rewarding the player.
 */
const WORDING = {
  idle: {
    glyph: '\u00b7\u00b7\u00b7',
    text: 'listening\u2026'
  },
  searching: {
    glyph: '\u2248',
    text: 'pulses present, measuring period\u2026'
  },
  detected: {
    glyph: '\u25cf',
    text: 'marker detected'
  },
  absent: {
    glyph: '\u2014',
    text: 'no marker \u2014 band is noise, or the transmitter is off'
  }
};
function DetectorStrip({
  state = 'idle',
  periodSec,
  perMinute,
  expectedSec,
  consistency
}) {
  const accentState = state === 'detected';
  const wording = WORDING[state] || WORDING.idle;
  let line = wording.text;
  if (state === 'detected' && periodSec) {
    const measured = `period ${periodSec.toFixed(2)} s (${Math.round(perMinute || 60 / periodSec)}/min)`;
    const matches = expectedSec != null && Math.abs(periodSec - expectedSec) <= expectedSec * 0.25;
    line = expectedSec == null ? `marker detected, ${measured}` : matches ? `marker detected, ${measured} \u2014 matches the published ${expectedSec.toFixed(2)} s` : `periodic signal at ${measured}, but the published period is ${expectedSec.toFixed(2)} s`;
  }
  if (state === 'searching' && periodSec) {
    line = `pulses present but irregular (${(consistency ?? 0).toFixed(2)} consistency)`;
  }
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      borderTop: 'var(--hairline-width) solid var(--border)',
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: 'var(--panel)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 2,
      overflow: 'hidden',
      background: 'var(--border)'
    }
  }, state === 'searching' && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 24,
      height: 2,
      background: 'var(--accent)',
      animation: 'echo-scan var(--dur-scan) linear infinite'
    }
  }), state === 'detected' && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--accent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-2)',
      padding: 'var(--space-3) var(--space-4)',
      color: accentState ? 'var(--accent)' : 'var(--dim)',
      font: `var(--text-body)/var(--leading-data) var(--font-mono)`,
      animation: accentState ? `echo-confirm var(--dur-deliberate) var(--ease-out) both` : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      opacity: 0.8
    }
  }, wording.glyph), /*#__PURE__*/React.createElement("span", null, line)), /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-scan { from { transform: translateX(-24px) } to { transform: translateX(calc(100vw + 24px)) } }
        @keyframes echo-confirm { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-scan { from { transform: translateX(0) } to { transform: translateX(0) } }
          @keyframes echo-confirm { from { opacity: 0 } to { opacity: 1 } }
        }
      `));
}
Object.assign(__ds_scope, { DetectorStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/DetectorStrip.jsx", error: String((e && e.message) || e) }); }

// components/instrument/LivePulse.jsx
try { (() => {
/**
 * The live-tier dot. Its period is the station's real marker period — 2.4 s for The
 * Buzzer, 1.2 s for The Pip — taken from station data, not a fixed house value. The
 * dot beats at the rate the transmitter is.
 *
 * Opacity only. Scaling a 6px dot alongside a 22fps waterfall is visible jank on
 * mid-range Android.
 */
function LivePulse({
  periodSec = 2.4,
  size = 6,
  color = 'var(--accent)',
  title
}) {
  return /*#__PURE__*/React.createElement("span", {
    title: title,
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      animation: `echo-pulse ${periodSec}s var(--ease-inout) infinite`,
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-pulse { 0%,100% { opacity: 1 } 50% { opacity: 1 } }
        }
      `));
}
Object.assign(__ds_scope, { LivePulse });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/LivePulse.jsx", error: String((e && e.message) || e) }); }

// components/archive/StationRow.jsx
try { (() => {
/**
 * One of 141 rows. Designator, name, operator. Live-tier rows carry the pulse at the
 * station's own marker period. Press feedback is opacity 0.7 on the row ground with no
 * exit animation and no ripple.
 */
function StationRow({
  designator,
  name,
  operator,
  tier = 'historical',
  periodSec,
  disputed = false,
  onOpen
}) {
  const [pressed, setPressed] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onOpen,
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '4.5rem 1fr auto',
      gridTemplateRows: 'auto auto',
      gap: '0 var(--space-2)',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: 'var(--space-2) var(--space-4)',
      border: 0,
      borderBottom: 'var(--hairline-width) solid var(--border)',
      borderRadius: 0,
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      opacity: pressed ? 0.7 : 1,
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      gridRow: 'span 2',
      color: 'var(--accent)',
      font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`,
      whiteSpace: 'nowrap'
    }
  }, designator, tier === 'live' && /*#__PURE__*/React.createElement(__ds_scope.LivePulse, {
    periodSec: periodSec ?? 2.4,
    title: "live marker"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-data) var(--font-sans)`
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      alignSelf: 'center'
    }
  }, disputed ? 'disputed' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      gridColumn: 2,
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`
    }
  }, operator));
}
Object.assign(__ds_scope, { StationRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/archive/StationRow.jsx", error: String((e && e.message) || e) }); }

// components/instrument/ReceiverRow.jsx
try { (() => {
/**
 * One truncating line: the selected receiver or the tuned station, with a chevron
 * opening its sheet. Used twice at the top of the live view.
 */
function ReceiverRow({
  label,
  value,
  meta,
  live = false,
  periodSec = 2.4,
  flag,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onOpen,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: 'var(--space-3)',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: 'var(--space-2) var(--space-4)',
      border: 0,
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-tight) var(--font-sans)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginTop: 2,
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-data) var(--font-mono)`,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, live && /*#__PURE__*/React.createElement(__ds_scope.LivePulse, {
    periodSec: periodSec,
    size: 8
  }), value, meta && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--dim)'
    }
  }, meta), flag)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: 'var(--dim)',
      font: `var(--text-title)/1 var(--font-mono)`
    }
  }, "\u203A"));
}
Object.assign(__ds_scope, { ReceiverRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/ReceiverRow.jsx", error: String((e && e.message) || e) }); }

// components/instrument/StatusLine.jsx
try { (() => {
/**
 * The app's status line: an ARIA live region that crossfades on change (motion item
 * 11) because movement would fight the announcement. It is where "connected but no
 * audio reached the analyser" gets said in plain words.
 */
function StatusLine({
  message = 'idle',
  tone = 'neutral',
  action
}) {
  const rail = {
    neutral: 'var(--dim)',
    live: 'var(--accent)',
    danger: 'var(--danger)',
    ok: 'var(--ok)'
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-3)',
      borderLeft: `2px solid ${rail}`,
      background: 'var(--panel)',
      color: tone === 'danger' ? 'var(--danger)' : 'var(--fg)',
      font: `var(--text-body)/var(--leading-body) var(--font-mono)`,
      transition: 'opacity var(--dur-fast) var(--ease-inout)'
    }
  }, /*#__PURE__*/React.createElement("span", null, message), action);
}
Object.assign(__ds_scope, { StatusLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/StatusLine.jsx", error: String((e && e.message) || e) }); }

// components/instrument/TransportBar.jsx
try { (() => {
/**
 * Fixed above the tab bar so it never scrolls away: the first tap on Connect is what
 * creates the audio graph, so this control is load-bearing and must be reachable
 * without scrolling on the smallest target device.
 *
 * Connect and Stop are one control that swaps role. It must not resize.
 */
function TransportBar({
  running = false,
  connecting = false,
  onConnect,
  onStop,
  onSynthetic,
  showSynthetic = true
}) {
  const label = connecting ? 'Connecting…' : running ? 'Stop' : 'Connect';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      padding: 'var(--space-2) var(--space-4)',
      paddingBottom: 'calc(var(--space-2) + var(--safe-bottom))',
      borderTop: 'var(--hairline-width) solid var(--border)',
      background: 'var(--panel)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: running ? onStop : onConnect,
    disabled: connecting,
    style: {
      flex: 1,
      transition: 'opacity var(--dur-fast) var(--ease-inout)'
    }
  }, label), showSynthetic && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "lg",
    onClick: onSynthetic,
    style: {
      flex: '0 0 auto',
      width: 132
    }
  }, "Synthetic"));
}
Object.assign(__ds_scope, { TransportBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/TransportBar.jsx", error: String((e && e.message) || e) }); }

// components/instrument/WaterfallPanel.jsx
try { (() => {
/**
 * The spectrogram viewport: 320 rows, full bleed, square corners, a kHz offset scale
 * along one edge (0–3 kHz of the SSB passband), newest row at the bottom.
 *
 * In the real app this is a canvas of height 2×320 translated under a clipping
 * viewport at 22 fps. Here it renders a static representation for design work: the
 * mock draws bands from the same inferno ramp the app uses. Nothing in a design may
 * require re-laying out or repainting this region while it runs.
 */
function WaterfallPanel({
  rows = 320,
  mock = 'detected',
  frozen = false,
  periodSec = 2.4
}) {
  const bands = [];
  if (mock !== 'blank') {
    const count = mock === 'noise' ? 44 : 26;
    for (let i = 0; i < count; i += 1) {
      const strong = mock === 'detected' && i % 3 === 0;
      bands.push({
        top: i / count * 100,
        height: strong ? 1.6 : 0.7,
        left: mock === 'noise' ? 8 + i * 37 % 80 : 46 + i * 13 % 7,
        width: strong ? 8 : 4,
        opacity: strong ? 1 : 0.55
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: rows,
      overflow: 'hidden',
      borderRadius: 'var(--radius-instrument)',
      background: 'var(--wf-ground)',
      animation: 'echo-waterfall-reveal var(--dur-base) var(--ease-out) both'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, var(--wf-01) 0%, var(--wf-00) 30%, var(--wf-01) 55%, var(--wf-00) 100%)',
      opacity: 0.75
    }
  }), bands.map((band, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    style: {
      position: 'absolute',
      top: `${band.top}%`,
      left: `${band.left}%`,
      width: `${band.width}%`,
      height: `${band.height}%`,
      background: `linear-gradient(90deg, var(--wf-04), var(--wf-07), var(--wf-04))`,
      opacity: band.opacity
    }
  })), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 34,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'var(--space-1) 0',
      background: 'linear-gradient(90deg, rgba(0,0,0,.72), transparent)',
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-tight) var(--font-mono)`
    }
  }, ['3k', '2k', '1k', '0'].map(label => /*#__PURE__*/React.createElement("span", {
    key: label,
    style: {
      paddingLeft: 'var(--space-1)'
    }
  }, label))), frozen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'var(--space-2)',
      right: 'var(--space-2)',
      padding: '2px var(--space-2)',
      border: 'var(--hairline-width) solid var(--accent)',
      color: 'var(--accent)',
      font: `var(--text-label)/1.6 var(--font-mono)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      background: 'rgba(0,0,0,.6)'
    }
  }, "frozen"), mock === 'blank' && /*#__PURE__*/React.createElement("p", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      margin: 0,
      color: 'var(--dim)',
      font: `var(--text-body)/var(--leading-body) var(--font-mono)`
    }
  }, "no signal yet"), /*#__PURE__*/React.createElement("style", null, `@keyframes echo-waterfall-reveal { from { opacity: 0 } to { opacity: 1 } }`));
}
Object.assign(__ds_scope, { WaterfallPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/WaterfallPanel.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppHeader.jsx
try { (() => {
/**
 * On phone the header keeps the app name and the theme control only — navigation has
 * moved to the tab bar. The name is the wordmark: there is no logo in the source.
 */
function AppHeader({
  title = 'Project Echo',
  theme = 'phosphor',
  onThemeChange
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-4)',
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      color: 'var(--accent)',
      font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`,
      letterSpacing: 'var(--tracking-brand)',
      textTransform: 'uppercase'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.ThemePicker, {
    value: theme,
    onChange: onThemeChange
  }));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/DetailHeader.jsx
try { (() => {
/** Header for the pushed station detail view: back affordance, designator, name. */
function DetailHeader({
  designator,
  name,
  tier,
  onBack
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-2)',
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": "Back to archive",
    style: {
      width: 'var(--touch-min)',
      height: 'var(--touch-min)',
      display: 'grid',
      placeItems: 'center',
      border: 0,
      background: 'transparent',
      color: 'var(--dim)',
      font: `var(--text-display)/1 var(--font-mono)`,
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent'
    }
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`,
      whiteSpace: 'nowrap'
    }
  }, designator), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)',
      font: `var(--text-title)/var(--leading-tight) var(--font-sans)`,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name)), tier && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: `var(--text-label)/1.4 var(--font-sans)`,
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, tier)));
}
Object.assign(__ds_scope, { DetailHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/DetailHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
/**
 * Bottom tab bar, three peers: Live, Schedule, Archive.
 *
 * Labels only, no icons — the source ships no icon set and its whole glyph vocabulary
 * is unicode in the mono face. Tabs are peers, not a stack, so switching fades and
 * lifts 8px; it never slides horizontally.
 */
const TABS = [{
  value: 'live',
  label: 'Live'
}, {
  value: 'schedule',
  label: 'Schedule'
}, {
  value: 'archive',
  label: 'Archive'
}];
function TabBar({
  value = 'live',
  onChange,
  tabs = TABS
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: '1fr',
      borderTop: 'var(--hairline-width) solid var(--border)',
      background: 'var(--panel)',
      paddingBottom: 'var(--safe-bottom)'
    }
  }, tabs.map(tab => {
    const on = tab.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.value,
      type: "button",
      "aria-current": on ? 'page' : undefined,
      onClick: () => onChange && onChange(tab.value),
      style: {
        position: 'relative',
        minHeight: 'var(--tabbar-height)',
        border: 0,
        background: 'transparent',
        color: on ? 'var(--accent)' : 'var(--dim)',
        font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: on ? 'var(--accent)' : 'transparent',
        boxShadow: on ? 'var(--glow-accent)' : 'none'
      }
    }), tab.label);
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/receiver/DirectoryRow.jsx
try { (() => {
/**
 * One public receiver from the proxied directory: location, free channels as 3/7, and
 * reported SNR. Sorted best-SNR first — a receiver with a free channel and a high SNR
 * is the one most likely to actually hear the marker.
 *
 * The upstream list returns 776 receivers for 4625 kHz. Never render them all: top 50
 * by SNR, a search field, and a "showing 50 of 776" line.
 */
function DirectoryRow({
  location,
  users,
  usersMax,
  snr,
  grid,
  selected = false,
  onAdopt
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAdopt,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      alignItems: 'center',
      gap: 'var(--space-3)',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: 'var(--space-2) 0',
      border: 0,
      borderBottom: 'var(--hairline-width) solid var(--border)',
      background: selected ? 'var(--tint-accent-weak)' : 'transparent',
      textAlign: 'left',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-data) var(--font-sans)`,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, location), grid && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-tight) var(--font-mono)`
    }
  }, grid)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: users != null && usersMax != null && users >= usersMax ? 'var(--danger)' : 'var(--dim)',
      font: `var(--text-label)/var(--leading-tight) var(--font-mono)`
    }
  }, users != null && usersMax != null ? `${users}/${usersMax}` : '—'), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 62,
      textAlign: 'right',
      color: 'var(--accent)',
      font: `var(--text-body)/var(--leading-tight) var(--font-mono)`
    }
  }, snr != null ? `SNR ${snr}` : '—'));
}
Object.assign(__ds_scope, { DirectoryRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/receiver/DirectoryRow.jsx", error: String((e && e.message) || e) }); }

// components/schedule/AlertSwitch.jsx
try { (() => {
/**
 * Per-slot alert subscription. The desktop build used a glyph-sized ◉/○ button; on
 * mobile it becomes a 44px switch. Track colour is the one documented exception to the
 * transform-and-opacity-only rule: a track is never near the waterfall.
 */
function AlertSwitch({
  on = false,
  disabled = false,
  onChange,
  label = 'Alert before this window'
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    "aria-label": label,
    disabled: disabled,
    onClick: () => onChange && onChange(!on),
    style: {
      width: 'var(--touch-min)',
      height: 'var(--touch-min)',
      display: 'grid',
      placeItems: 'center',
      border: 0,
      background: 'transparent',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 34,
      height: 20,
      borderRadius: 10,
      border: `var(--hairline-width) solid ${on ? 'var(--accent)' : 'var(--border)'}`,
      background: on ? 'var(--tint-accent-press)' : 'var(--panel)',
      transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 2,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: on ? 'var(--accent)' : 'var(--dim)',
      transform: on ? 'translateX(14px)' : 'translateX(0)',
      transition: 'transform var(--dur-fast) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { AlertSwitch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/schedule/AlertSwitch.jsx", error: String((e && e.message) || e) }); }

// components/schedule/CoverageNote.jsx
try { (() => {
/**
 * The honest header block. Two facts, always stated: how much of the data is actually
 * imported, and what the notification permission can and cannot do.
 *
 * Alerts are per-browser and only fire while a tab is open — there is no service
 * worker, because the app must be served over plain http. "granted" says so; "denied"
 * says it is not recoverable in-app rather than offering a button that does nothing.
 */
const PERMISSION_COPY = {
  default: 'Enable notifications to be reminded before a window opens.',
  granted: 'Alerts fire 10 minutes ahead, while a tab is open. There is no server, so a closed browser means no alert.',
  denied: 'Notifications are blocked for this site. Alerts will not fire until that is changed in browser settings.',
  unsupported: 'This browser has no Notification API, so alerts cannot fire here.'
};
function CoverageNote({
  coverage,
  permission = 'default',
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      padding: 'var(--space-3) var(--space-4)',
      borderBottom: 'var(--hairline-width) solid var(--border)'
    }
  }, coverage && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-body) var(--font-sans)`,
      maxWidth: '60ch',
      textWrap: 'pretty'
    }
  }, coverage), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: permission === 'denied' ? 'var(--danger)' : 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`,
      maxWidth: '60ch',
      textWrap: 'pretty'
    }
  }, PERMISSION_COPY[permission]), action);
}
Object.assign(__ds_scope, { CoverageNote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/schedule/CoverageNote.jsx", error: String((e && e.message) || e) }); }

// components/schedule/ScheduleRow.jsx
try { (() => {
/**
 * One upcoming transmission window. The countdown is the row's emphasis, monospace,
 * and turns accent under an hour. It changes on a timer, so it never animates on the
 * tick — only on crossing 1 h, 10 min and 1 min.
 */
function ScheduleRow({
  designator,
  name,
  utc,
  local,
  countdown,
  khz,
  note,
  urgent = false,
  alertOn = false,
  alertDisabled = false,
  onToggleAlert
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'var(--touch-min) 1fr auto',
      gap: '0 var(--space-3)',
      alignItems: 'center',
      padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-2)',
      borderBottom: 'var(--hairline-width) solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.AlertSwitch, {
    on: alertOn,
    disabled: alertDisabled,
    onChange: onToggleAlert
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)',
      font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`,
      whiteSpace: 'nowrap'
    }
  }, designator), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)',
      font: `var(--text-body)/var(--leading-data) var(--font-sans)`,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-mono)`
    }
  }, utc, " \xB7 ", local, " \xB7 ", khz ? `${khz} kHz` : '—'), note && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2,
      color: 'var(--dim)',
      font: `var(--text-label)/var(--leading-body) var(--font-sans)`,
      textWrap: 'pretty'
    }
  }, note)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: urgent ? 'var(--accent)' : 'var(--fg)',
      font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`,
      whiteSpace: 'nowrap',
      alignSelf: 'start',
      paddingTop: 2
    }
  }, countdown));
}
Object.assign(__ds_scope, { ScheduleRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/schedule/ScheduleRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/App.jsx
try { (() => {
const {
  AppHeader,
  TabBar
} = window.ProjectEchoDesignSystem_453425;
const {
  LiveScreen,
  ScheduleScreen,
  ArchiveScreen,
  StationDetail,
  ReceiverSheet,
  StationSheet,
  DirectorySheet
} = window;
const DATA = window.EchoData;
function App() {
  const [theme, setTheme] = React.useState('phosphor');
  const [tab, setTab] = React.useState('live');
  const [sheet, setSheet] = React.useState(null);
  const [detailId, setDetailId] = React.useState(null);
  const [receivers, setReceivers] = React.useState(DATA.receivers);
  const [receiverId, setReceiverId] = React.useState(DATA.receivers[0].id);
  const [stationId, setStationId] = React.useState('S28');
  const [frequencyIndex, setFrequencyIndex] = React.useState(0);
  const [phase, setPhase] = React.useState('idle');
  const [detector, setDetector] = React.useState('idle');
  const [directoryLoading, setDirectoryLoading] = React.useState(false);
  const [directoryQuery, setDirectoryQuery] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [tier, setTier] = React.useState('');
  const [permission, setPermission] = React.useState('default');
  const [alerts, setAlerts] = React.useState({
    0: true
  });
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const receiver = receivers.find(candidate => candidate.id === receiverId) || null;
  const station = DATA.stations.find(candidate => candidate.id === stationId);
  const frequency = station.frequencies[frequencyIndex] || station.frequencies[0] || null;
  const detail = detailId ? DATA.stations.find(candidate => candidate.id === detailId) : null;

  /* Connect is the load-bearing tap: it walks connecting → running, then the detector
     goes searching → detected, which is the transition worth designing carefully. */
  const connect = () => {
    setPhase('connecting');
    setDetector('idle');
    window.setTimeout(() => {
      setPhase('running');
      setDetector('searching');
    }, 900);
    window.setTimeout(() => setDetector('detected'), 3200);
  };
  const stop = () => {
    setPhase('idle');
    setDetector('idle');
  };
  const synthetic = () => {
    setPhase('running');
    setDetector('searching');
    window.setTimeout(() => setDetector('detected'), 1600);
  };
  const openDirectory = () => {
    setSheet('directory');
    setDirectoryLoading(true);
    window.setTimeout(() => setDirectoryLoading(false), 1100);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 393,
      height: 852,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    theme: theme,
    onThemeChange: setTheme
  }), /*#__PURE__*/React.createElement("main", {
    key: tab,
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      animation: 'echo-tab var(--dur-base) var(--ease-out) both'
    }
  }, tab === 'live' && /*#__PURE__*/React.createElement(LiveScreen, {
    receiver: receiver,
    station: station,
    frequency: frequency,
    phase: phase,
    detector: detector,
    serverPresent: true,
    onOpenReceiver: () => setSheet('receiver'),
    onOpenStation: () => setSheet('station'),
    onConnect: connect,
    onStop: stop,
    onSynthetic: synthetic
  }), tab === 'schedule' && /*#__PURE__*/React.createElement(ScheduleScreen, {
    rows: DATA.schedule,
    permission: permission,
    alerts: alerts,
    onAskPermission: () => setPermission('granted'),
    onToggleAlert: index => setAlerts(current => ({
      ...current,
      [index]: !current[index]
    }))
  }), tab === 'archive' && /*#__PURE__*/React.createElement(ArchiveScreen, {
    stations: DATA.stations,
    query: query,
    tier: tier,
    onQuery: setQuery,
    onTier: setTier,
    onOpen: setDetailId
  })), /*#__PURE__*/React.createElement(TabBar, {
    value: tab,
    onChange: next => {
      setTab(next);
      setDetailId(null);
    }
  }), detail && /*#__PURE__*/React.createElement(StationDetail, {
    station: detail,
    links: DATA.archiveLinks,
    onBack: () => setDetailId(null)
  }), sheet === 'receiver' && /*#__PURE__*/React.createElement(ReceiverSheet, {
    receivers: receivers,
    selectedId: receiverId,
    onSelect: id => {
      setReceiverId(id);
      setSheet(null);
    },
    onBrowse: openDirectory,
    onDismiss: () => setSheet(null)
  }), sheet === 'station' && /*#__PURE__*/React.createElement(StationSheet, {
    stations: DATA.stations,
    selectedId: stationId,
    onSelect: (id, index) => {
      setStationId(id);
      setFrequencyIndex(index);
      setSheet(null);
    },
    onDismiss: () => setSheet(null)
  }), sheet === 'directory' && /*#__PURE__*/React.createElement(DirectorySheet, {
    loading: directoryLoading,
    rows: DATA.directory,
    total: DATA.directoryTotal,
    query: directoryQuery,
    onQuery: setDirectoryQuery,
    onAdopt: row => {
      setReceivers(current => current.some(r => r.id === row.location) ? current : [...current, {
        id: row.location,
        label: row.location,
        grid: row.grid,
        location: row.location
      }]);
      setReceiverId(row.location);
      setSheet(null);
    },
    onDismiss: () => setSheet(null)
  }), /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-tab { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @media (prefers-reduced-motion: reduce) { @keyframes echo-tab { from { opacity: 0 } to { opacity: 1 } } }
      `));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/ArchiveScreen.jsx
try { (() => {
const {
  SearchField,
  SegmentedControl,
  StationRow,
  TierHeader,
  GapNotice
} = window.ProjectEchoDesignSystem_453425;
const TIER_LABEL = {
  live: 'Live markers',
  scheduled: 'Scheduled',
  historical: 'Historical'
};

/** 141 rows in the real app; the fixture carries 12. Section headers by tier when unfiltered. */
function ArchiveScreen({
  stations,
  query,
  tier,
  onQuery,
  onTier,
  onOpen
}) {
  const matched = stations.filter(station => {
    if (tier && station.tier !== tier) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return station.id.toLowerCase().includes(q) || station.name.toLowerCase().includes(q) || station.operator.toLowerCase().includes(q);
  });
  const groups = tier ? [[tier, matched]] : ['live', 'scheduled', 'historical'].map(t => [t, matched.filter(s => s.tier === t)]).filter(([, list]) => list.length);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    value: query,
    onChange: onQuery
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    value: tier,
    onChange: onTier,
    options: [{
      value: '',
      label: 'All'
    }, {
      value: 'live',
      label: 'Live'
    }, {
      value: 'scheduled',
      label: 'Scheduled'
    }, {
      value: 'historical',
      label: 'Historical'
    }]
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--dim)',
      font: 'var(--text-label)/var(--leading-body) var(--font-sans)'
    }
  }, "141 stations \u2014 3 live markers, 26 scheduled, 112 historical. Status is shown as a dated claim, because most published \"active\" listings are stale.")), matched.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(GapNotice, {
    title: "No station matches"
  }, "Nothing in the roster matches that search. Designators are the reliable key \u2014 try \"S28\", \"Buzzer\", or an operator name.")) : groups.map(([groupTier, list]) => /*#__PURE__*/React.createElement("div", {
    key: groupTier
  }, /*#__PURE__*/React.createElement(TierHeader, {
    label: TIER_LABEL[groupTier],
    count: list.length
  }), list.map(station => /*#__PURE__*/React.createElement(StationRow, {
    key: station.id,
    designator: station.id,
    name: station.name,
    operator: station.operator,
    tier: station.tier,
    periodSec: station.periodSec,
    disputed: station.disputed,
    onOpen: () => onOpen(station.id)
  })))));
}
Object.assign(window, {
  ArchiveScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/ArchiveScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/LiveScreen.jsx
try { (() => {
const {
  ReceiverRow,
  WaterfallPanel,
  DetectorStrip,
  StatusLine,
  TransportBar,
  GapNotice,
  Flag,
  Button
} = window.ProjectEchoDesignSystem_453425;

/**
 * Live view, phone order: receiver row, station row, full-bleed waterfall, detector
 * strip, then the fixed transport bar above the tab bar. Propagation and diagnostics
 * are collapsed below the fold.
 */
function LiveScreen({
  receiver,
  station,
  frequency,
  phase,
  detector,
  onOpenReceiver,
  onOpenStation,
  onConnect,
  onStop,
  onSynthetic,
  serverPresent
}) {
  const connected = phase === 'running';
  const status = {
    idle: {
      message: 'idle',
      tone: 'neutral'
    },
    connecting: {
      message: `connecting to ${receiver ? receiver.label : '—'}…`,
      tone: 'neutral'
    },
    running: {
      message: `running — ${receiver ? receiver.label + ' · ' + receiver.grid : 'synthetic marker'}`,
      tone: 'live'
    },
    stalled: {
      message: 'connected but no audio reached the analyser — all channels may be busy',
      tone: 'danger'
    }
  }[phase];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 auto',
      overflowY: 'auto',
      minHeight: 0
    }
  }, receiver ? /*#__PURE__*/React.createElement(ReceiverRow, {
    label: "Receiver",
    value: receiver.label,
    meta: `· ${receiver.grid}`,
    onOpen: onOpenReceiver
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(GapNotice, {
    title: "No receiver saved"
  }, "Pick a public KiwiSDR with propagation to the transmitter. Saving one only stores its address in this browser; the connection goes straight to that node."), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onOpenReceiver
  }, "Choose a receiver"))), /*#__PURE__*/React.createElement(ReceiverRow, {
    label: "Station",
    value: `${station.id} ${station.name}`,
    meta: frequency ? `· ${frequency.khz} kHz ${frequency.mode}` : null,
    live: station.tier === 'live',
    periodSec: station.periodSec || 2.4,
    flag: frequency && frequency.disputed ? /*#__PURE__*/React.createElement(Flag, null, "disputed") : null,
    onOpen: onOpenStation
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-2) var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(StatusLine, {
    message: status.message,
    tone: status.tone,
    action: phase === 'stalled' ? /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: onOpenReceiver
    }, "Try another") : null
  })), /*#__PURE__*/React.createElement(WaterfallPanel, {
    rows: 300,
    mock: connected ? detector === 'detected' ? 'detected' : 'noise' : 'blank'
  }), /*#__PURE__*/React.createElement(DetectorStrip, {
    state: connected ? detector : 'idle',
    periodSec: detector === 'detected' ? 2.38 : undefined,
    perMinute: detector === 'detected' ? 25 : undefined,
    expectedSec: station.periodSec || undefined
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", {
    style: {
      color: 'var(--dim)',
      font: 'var(--text-label)/1.6 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      cursor: 'pointer'
    }
  }, "Propagation"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-2) 0 0',
      color: 'var(--dim)',
      font: 'var(--text-label)/var(--leading-body) var(--font-sans)',
      textWrap: 'pretty'
    }
  }, "Maximum usable frequency, from prop.kc2g.com (IRI-2016 conditioned on live ionosonde data, regenerated every five minutes). If the station's frequency sits above the MUF on your path, the band is shut and the silence is the ionosphere, not the transmitter.")), serverPresent && /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", {
    style: {
      color: 'var(--dim)',
      font: 'var(--text-label)/1.6 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      cursor: 'pointer'
    }
  }, "Diagnostics"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-2) 0 0',
      color: 'var(--dim)',
      font: 'var(--text-label)/var(--leading-body) var(--font-sans)',
      textWrap: 'pretty'
    }
  }, "A fixed 30-second recording shaped like The Buzzer, served with and without CORS headers from the server's other loopback name. The first should give a waterfall and a detected 2.4 s period; the second should report silence.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--dim)',
      font: 'var(--text-label)/var(--leading-body) var(--font-sans)',
      textWrap: 'pretty'
    }
  }, "Live means live while this tab is in front \u2014 iOS suspends audio in the background. This app records observations about signals, never their contents."))), /*#__PURE__*/React.createElement(TransportBar, {
    running: connected || phase === 'stalled',
    connecting: phase === 'connecting',
    onConnect: onConnect,
    onStop: onStop,
    onSynthetic: onSynthetic,
    showSynthetic: serverPresent
  }));
}
Object.assign(window, {
  LiveScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/LiveScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/ScheduleScreen.jsx
try { (() => {
const {
  CoverageNote,
  ScheduleRow,
  GapNotice,
  Button
} = window.ProjectEchoDesignSystem_453425;

/** Upcoming windows, soonest first. Countdown is the row's emphasis. */
function ScheduleScreen({
  rows,
  permission,
  alerts,
  onToggleAlert,
  onAskPermission
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(CoverageNote, {
    coverage: "1 of 26 scheduled stations have imported schedules. Times are as published, in UTC. Several operators rotate frequencies month by month, so a slot that is silent on the listed frequency may simply have moved.",
    permission: permission,
    action: permission === 'default' ? /*#__PURE__*/React.createElement(Button, {
      onClick: onAskPermission
    }, "Enable notifications") : null
  }), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(GapNotice, {
    title: "No schedules imported"
  }, "No schedules have been imported yet. This is a data gap, not a quiet band \u2014 Priyom publishes further slots that have not been parsed into the fixture.")) : rows.map((row, index) => /*#__PURE__*/React.createElement(ScheduleRow, {
    key: index,
    designator: row.id,
    name: row.name,
    utc: row.utc,
    local: row.local,
    countdown: row.countdown,
    khz: row.khz,
    note: row.note,
    urgent: row.urgent,
    alertOn: !!alerts[index],
    alertDisabled: permission === 'denied' || permission === 'unsupported',
    onToggleAlert: () => onToggleAlert(index)
  })));
}
Object.assign(window, {
  ScheduleScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/ScheduleScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/Sheets.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  BottomSheet,
  DirectoryRow,
  SearchField,
  Skeleton,
  ReceiverRow,
  Flag,
  Button
} = window.ProjectEchoDesignSystem_453425;
function ReceiverSheet({
  receivers,
  selectedId,
  onSelect,
  onBrowse,
  onDismiss
}) {
  return /*#__PURE__*/React.createElement(BottomSheet, {
    title: "Receiver",
    note: "Saved in this browser. Your audio connection goes straight to that node, under that node's own rules.",
    onDismiss: onDismiss,
    height: "72%"
  }, receivers.map(receiver => /*#__PURE__*/React.createElement("button", {
    key: receiver.id,
    type: "button",
    onClick: () => onSelect(receiver.id),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 'var(--space-3)',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: 'var(--space-2) 0',
      border: 0,
      borderBottom: '1px solid var(--border)',
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--fg)',
      font: 'var(--text-body)/var(--leading-data) var(--font-sans)'
    }
  }, receiver.label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: 'var(--text-label)/1.4 var(--font-mono)'
    }
  }, receiver.grid)), receiver.id === selectedId && /*#__PURE__*/React.createElement(Flag, null, "selected"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onBrowse
  }, "Browse directory"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Add by host")));
}
function StationSheet({
  stations,
  selectedId,
  onSelect,
  onDismiss
}) {
  return /*#__PURE__*/React.createElement(BottomSheet, {
    title: "Station",
    note: "Only the three continuously-transmitting Russian markers are offered here. Scheduled stations live on the Schedule tab.",
    onDismiss: onDismiss,
    height: "72%"
  }, stations.filter(s => s.tier === 'live').flatMap(station => (station.frequencies.length ? station.frequencies : [null]).map((frequency, index) => /*#__PURE__*/React.createElement("button", {
    key: station.id + index,
    type: "button",
    onClick: () => onSelect(station.id, index),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 'var(--space-3)',
      width: '100%',
      minHeight: 'var(--touch-min)',
      padding: 'var(--space-2) 0',
      border: 0,
      borderBottom: '1px solid var(--border)',
      background: 'transparent',
      textAlign: 'left',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--fg)',
      font: 'var(--text-body)/var(--leading-data) var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, station.id), " ", station.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--dim)',
      font: 'var(--text-label)/1.4 var(--font-mono)'
    }
  }, frequency ? `${frequency.khz} kHz ${frequency.mode}${frequency.timeOfDay ? ' (' + frequency.timeOfDay + ')' : ''}` : 'no frequency imported')), frequency && frequency.disputed && /*#__PURE__*/React.createElement(Flag, null, "disputed")))));
}
function DirectorySheet({
  loading,
  rows,
  total,
  query,
  onQuery,
  onAdopt,
  onDismiss
}) {
  const shown = rows.filter(row => row.location.toLowerCase().includes(query.toLowerCase()));
  return /*#__PURE__*/React.createElement(BottomSheet, {
    title: "Public receivers",
    note: `Showing ${shown.length} of ${total} receivers covering 4625 kHz with a free channel. Source: rx.linkfanel.net, sorted by reported SNR.`,
    onDismiss: onDismiss
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(SearchField, {
    value: query,
    onChange: onQuery,
    placeholder: "Search location"
  })), loading ? /*#__PURE__*/React.createElement(Skeleton, {
    rows: 3
  }) : shown.map(row => /*#__PURE__*/React.createElement(DirectoryRow, _extends({
    key: row.location
  }, row, {
    onAdopt: () => onAdopt(row)
  }))));
}
Object.assign(window, {
  ReceiverSheet,
  StationSheet,
  DirectorySheet
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/Sheets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/StationDetail.jsx
try { (() => {
const {
  DetailHeader,
  DetailList,
  ProvenanceTable,
  GapNotice,
  Flag
} = window.ProjectEchoDesignSystem_453425;
const TIER_LABEL = {
  live: 'Live marker',
  scheduled: 'Scheduled',
  historical: 'Historical'
};

/**
 * Full-screen push, not a sheet: provenance tables, lore, hearings and archive links
 * are too much for a sheet. Roster-only entries replace the tables with the stated gap.
 */
function StationDetail({
  station,
  links,
  onBack
}) {
  const rosterOnly = !station.lore;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      animation: 'echo-push var(--dur-slow) var(--ease-out) both'
    }
  }, /*#__PURE__*/React.createElement(DetailHeader, {
    designator: station.id,
    name: station.name,
    tier: TIER_LABEL[station.tier],
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(DetailList, {
    items: [{
      label: 'Classification',
      value: station.classification
    }, {
      label: 'Operator',
      value: station.operator
    }, {
      label: 'Status',
      value: `${TIER_LABEL[station.tier]}, ${station.lastConfirmed ? 'last confirmed ' + station.lastConfirmed : 'never confirmed'}`
    }, ...(station.marker ? [{
      label: 'Marker',
      value: station.marker
    }] : []), ...(station.aliases && station.aliases.length ? [{
      label: 'Also known as',
      value: station.aliases.join(', ')
    }] : [])]
  }), rosterOnly ? /*#__PURE__*/React.createElement(GapNotice, {
    title: "Roster entry",
    links: links
  }, "The designator, name, operator and status are sourced; frequencies, schedules and history have not been imported yet.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--fg)',
      font: 'var(--text-body)/var(--leading-body) var(--font-sans)',
      textWrap: 'pretty'
    }
  }, station.lore), station.frequencies.length > 0 && /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 var(--space-2)',
      color: 'var(--dim)',
      font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, "Frequencies ", station.disputed && /*#__PURE__*/React.createElement(Flag, null, "sources disagree")), /*#__PURE__*/React.createElement(ProvenanceTable, {
    rows: station.frequencies
  })), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 var(--space-2)',
      color: 'var(--dim)',
      font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, "Heard here"), station.hearings && station.hearings.length ? /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      color: 'var(--fg)',
      font: 'var(--text-label)/var(--leading-data) var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['When', 'kHz', 'Period', 'Receiver'].map(headCell => /*#__PURE__*/React.createElement("th", {
    key: headCell,
    style: {
      textAlign: 'left',
      padding: 'var(--space-1) var(--space-2) var(--space-1) 0',
      borderBottom: '1px solid var(--border)',
      color: 'var(--dim)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, headCell)))), /*#__PURE__*/React.createElement("tbody", null, station.hearings.map(hearing => /*#__PURE__*/React.createElement("tr", {
    key: hearing.when
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 'var(--space-1) var(--space-2) var(--space-1) 0',
      borderBottom: '1px solid var(--border)'
    }
  }, hearing.when), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 'var(--space-1) var(--space-2) var(--space-1) 0',
      borderBottom: '1px solid var(--border)'
    }
  }, hearing.khz), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 'var(--space-1) var(--space-2) var(--space-1) 0',
      borderBottom: '1px solid var(--border)'
    }
  }, hearing.periodSec.toFixed(2), " s"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: 'var(--space-1) var(--space-2) var(--space-1) 0',
      borderBottom: '1px solid var(--border)'
    }
  }, hearing.receiver))))) : /*#__PURE__*/React.createElement(GapNotice, null, "No hearings recorded yet. The live view records one when the detector locks onto this station's marker \u2014 timing and frequency only, never any content.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 var(--space-2)',
      color: 'var(--dim)',
      font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase'
    }
  }, "Recordings and logs"), /*#__PURE__*/React.createElement(GapNotice, {
    links: links
  }, "Searches on the established archives. This app hosts no message recordings: publishing the contents of non-broadcast transmissions is the regulated act, and the hobby groups have curated these for decades.")))), /*#__PURE__*/React.createElement("style", null, `
        @keyframes echo-push { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @media (prefers-reduced-motion: reduce) { @keyframes echo-push { from { opacity: 0 } to { opacity: 1 } } }
      `));
}
Object.assign(window, {
  StationDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/StationDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/echo-mobile/data.js
try { (() => {
/*
 * Fixture for the UI kit, lifted from numberstationsApp/src/data/stations.ts.
 * Real designators, operators, frequencies, dates and sources — abbreviated to the
 * rows a screen needs. 141 stations exist; 12 stand in for them here.
 */
window.EchoData = {
  receivers: [{
    id: 'kiwi-1',
    label: 'Moscow region',
    grid: 'KO85',
    location: 'Moscow region, RU'
  }, {
    id: 'kiwi-2',
    label: 'Tampere',
    grid: 'KP21',
    location: 'Tampere, FI'
  }],
  directory: [{
    location: 'Moscow region, RU',
    grid: 'KO85',
    users: 3,
    usersMax: 7,
    snr: 31
  }, {
    location: 'Tampere, FI',
    grid: 'KP21',
    users: 1,
    usersMax: 4,
    snr: 27
  }, {
    location: 'Kaliningrad, RU',
    grid: 'KO04',
    users: 4,
    usersMax: 4,
    snr: 24
  }, {
    location: 'Warsaw, PL',
    grid: 'KO02',
    users: 0,
    usersMax: 8,
    snr: 19
  }, {
    location: 'Bucharest, RO',
    grid: 'KN34',
    users: 2,
    usersMax: 6,
    snr: 17
  }, {
    location: 'Reykjavik, IS',
    grid: 'HP94',
    users: 1,
    usersMax: 4,
    snr: 12
  }],
  directoryTotal: 776,
  stations: [{
    id: 'S28',
    name: 'The Buzzer',
    operator: 'Russian military, 69th communications hub',
    tier: 'live',
    classification: 'Slavic voice',
    periodSec: 2.4,
    marker: '~1.2 s buzz tone, repeating ~25 times per minute, 24 hours a day',
    lastConfirmed: '2025-11-15',
    aliases: ['UVB-76', 'MDZhB', 'ZhUOZ', 'ANVF'],
    lore: 'The best known of the Russian channel markers. "UVB-76" is an obsolete callsign from the 1970s and 80s and is not what the station transmits today: voice identifiers observed since 2010 run MDZhB, then ZhUOZ from 2019, then ANVF. The transmitter site moved from Povarovo to Naro-Fominsk in 2010. Voice messages interrupt the buzzer irregularly and are read in the Russian phonetic alphabet; monitors logged a marked increase in them through 2025, peaking in March and April.',
    frequencies: [{
      khz: 4625,
      mode: 'USB',
      timeOfDay: null,
      lastConfirmed: '2025-11-15',
      sourceUrl: 'https://en.wikipedia.org/wiki/UVB-76'
    }],
    hearings: [{
      when: '2026-09-10 14:22',
      khz: 4625,
      periodSec: 2.38,
      receiver: 'Moscow region'
    }, {
      when: '2026-09-10 13:19',
      khz: 4625,
      periodSec: 2.41,
      receiver: 'Moscow region'
    }]
  }, {
    id: 'S30',
    name: 'The Pip',
    operator: 'Russian military, North Caucasus communications centre (callsign Akacia)',
    tier: 'live',
    classification: 'Slavic voice',
    periodSec: 1.2,
    marker: 'Short beep, repeating ~50 times per minute',
    lastConfirmed: '2025-01-01',
    aliases: ['8S1Shch', 'Akacia'],
    lore: 'A companion marker to The Buzzer, running a faster and much shorter pulse. Radioscanner attributes it to a North Caucasus military district communications centre, callsign Akacia, formerly the 72nd communications centre. Like the Buzzer it carries occasional Russian voice traffic.',
    frequencies: [{
      khz: 5448,
      mode: 'USB',
      timeOfDay: 'day',
      lastConfirmed: '2025-01-01',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip'
    }, {
      khz: 3756,
      mode: 'USB',
      timeOfDay: 'night',
      lastConfirmed: '2025-01-01',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip'
    }],
    hearings: []
  }, {
    id: 'S32',
    name: 'The Squeaky Wheel',
    operator: 'Russian military, Southern district',
    tier: 'live',
    classification: 'Slavic voice',
    periodSec: null,
    marker: 'Repeating squeaking sweep',
    lastConfirmed: '2025-01-01',
    aliases: ['XSW'],
    disputed: true,
    lore: 'The third Russian marker, and the reason this database stores frequencies as sourced observations rather than constants: two different frequency pairs are published for it and neither source retracts the other. Both are listed below, flagged as disputed. Confirm against the waterfall before trusting either.',
    frequencies: [{
      khz: 5473,
      mode: 'USB',
      timeOfDay: 'day',
      lastConfirmed: '2021-12-01',
      sourceUrl: 'http://mt-milcom.blogspot.com/',
      disputed: true
    }, {
      khz: 3828,
      mode: 'USB',
      timeOfDay: 'night',
      lastConfirmed: '2021-12-01',
      sourceUrl: 'http://mt-milcom.blogspot.com/',
      disputed: true
    }, {
      khz: 5367,
      mode: 'USB',
      timeOfDay: 'day',
      lastConfirmed: '2025-01-01',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel',
      disputed: true
    }, {
      khz: 3363.5,
      mode: 'USB',
      timeOfDay: 'night',
      lastConfirmed: '2025-01-01',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel',
      disputed: true
    }],
    hearings: []
  }, {
    id: 'E11',
    name: 'Oblique',
    operator: 'Poland',
    tier: 'scheduled',
    classification: 'English voice',
    periodSec: null,
    marker: null,
    lastConfirmed: '2026-09-10',
    aliases: [],
    lore: 'An English-language station operated from Poland, which took over the role of G02 "Swedish Rhapsody". Transmissions open with a three-digit identifier and either carry a message or announce that there is none. Frequencies rotate month by month, so a slot that is silent on the frequency below may simply have moved.',
    frequencies: [],
    hearings: []
  }, {
    id: 'M01',
    name: 'M01',
    operator: 'Russia',
    tier: 'scheduled',
    classification: 'Morse',
    lastConfirmed: '2026-09-10',
    aliases: [],
    lore: null,
    frequencies: [],
    hearings: []
  }, {
    id: 'XPA2',
    name: 'Polytones',
    operator: 'Russia, SVR',
    tier: 'scheduled',
    classification: 'Digital (other)',
    lastConfirmed: '2026-09-10',
    aliases: [],
    lore: null,
    frequencies: [],
    hearings: []
  }, {
    id: 'F06',
    name: 'F06',
    operator: 'Russia',
    tier: 'scheduled',
    classification: 'Digital (FSK)',
    lastConfirmed: '2026-09-10',
    aliases: [],
    lore: null,
    frequencies: [],
    hearings: []
  }, {
    id: 'E03',
    name: 'The Lincolnshire Poacher',
    operator: 'United Kingdom, attributed to the Secret Intelligence Service',
    tier: 'historical',
    classification: 'English voice',
    lastConfirmed: '2008-07-02',
    aliases: [],
    lore: 'The most famous numbers station ever operated, and the one most listeners mean when they say "numbers station". Two bars of the English folk tune "The Lincolnshire Poacher" played as an interval signal, repeated twelve times, then a synthesised English female voice read five-figure groups. Transmitted from RAF Akrotiri in Cyprus. The final recorded transmission was on 2 July 2008.',
    frequencies: [],
    hearings: []
  }, {
    id: 'E03a',
    name: 'Cherry Ripe',
    operator: 'United Kingdom, attributed to the Secret Intelligence Service',
    tier: 'historical',
    classification: 'English voice',
    lastConfirmed: '2009-12-01',
    aliases: [],
    lore: 'The southern-hemisphere sister of E03, using the folk song "Cherry Ripe" as its interval signal. It transmitted for years from the US base on Guam, moved to Humpty Doo in Australia in late September 2009, ran there for only two months, and stopped in December 2009.',
    frequencies: [],
    hearings: []
  }, {
    id: 'V02a',
    name: 'Atención',
    operator: 'Cuba, Dirección General de Inteligencia',
    tier: 'historical',
    classification: 'Other-language voice',
    lastConfirmed: '2019-02-01',
    aliases: ['The Cuban Lady', 'The Spanish Lady'],
    lore: 'Opened with "¡Atención! ¡Atención!" and a synthesised Spanish female voice reading five-figure groups. V02a replaced the original V02 in 1997. Most of its schedules were taken over by the digital HM01 in November 2012, and it went inactive in February 2019 alongside its Morse counterpart M08a. Widely and wrongly still listed as active.',
    frequencies: [],
    hearings: []
  }, {
    id: 'M13c',
    name: 'M13c',
    operator: 'Bulgaria',
    tier: 'historical',
    classification: 'Morse',
    lastConfirmed: null,
    aliases: [],
    lore: null,
    frequencies: [],
    hearings: []
  }, {
    id: 'V30',
    name: 'The Lighthouse',
    operator: 'Vietnam',
    tier: 'historical',
    classification: 'Other-language voice',
    lastConfirmed: null,
    aliases: [],
    lore: null,
    frequencies: [],
    hearings: []
  }],
  schedule: [{
    id: 'E11',
    name: 'Oblique',
    utc: 'Mon 03:15 UTC',
    local: 'Mon 04:15',
    countdown: 'in 42 m',
    urgent: true,
    khz: 8102,
    note: 'ID 25. Frequency rotates monthly; 8102 kHz is the January listing.'
  }, {
    id: 'E11',
    name: 'Oblique',
    utc: 'Tue 05:05 UTC',
    local: 'Tue 06:05',
    countdown: 'in 1 d 2 h',
    urgent: false,
    khz: 12153,
    note: 'ID 33. Frequency rotates monthly.'
  }, {
    id: 'E11',
    name: 'Oblique',
    utc: 'Mon 06:00 UTC',
    local: 'Mon 07:00',
    countdown: 'in 3 h 27 m',
    urgent: false,
    khz: 20286,
    note: 'ID 94. Frequency rotates monthly.'
  }, {
    id: 'E11',
    name: 'Oblique',
    utc: 'Fri 06:00 UTC',
    local: 'Fri 07:00',
    countdown: 'in 4 d 3 h',
    urgent: false,
    khz: 7850,
    note: 'ID 35. Frequency rotates monthly.'
  }, {
    id: 'E11',
    name: 'Oblique',
    utc: 'Tue 06:45 UTC',
    local: 'Tue 07:45',
    countdown: 'in 1 d 4 h',
    urgent: false,
    khz: 12385,
    note: 'ID 51. Frequency rotates monthly.'
  }],
  archiveLinks: [{
    label: 'Shortwave Radio Audio Archive',
    url: 'https://shortwavearchive.com/',
    description: 'Dated off-air recordings contributed by listeners.'
  }, {
    label: 'Internet Archive',
    url: 'https://archive.org/',
    description: 'Long-form recordings and collections, including complete transmissions.'
  }, {
    label: 'Signal Identification Wiki',
    url: 'https://www.sigidwiki.com/',
    description: 'Reference waveforms, spectrograms and sample audio for identification.'
  }, {
    label: 'Priyom.org',
    url: 'https://priyom.org/',
    description: 'Logs, schedules and transmission history maintained by the community.'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/echo-mobile/data.js", error: String((e && e.message) || e) }); }

__ds_ns.DetailList = __ds_scope.DetailList;

__ds_ns.Flag = __ds_scope.Flag;

__ds_ns.GapNotice = __ds_scope.GapNotice;

__ds_ns.ProvenanceTable = __ds_scope.ProvenanceTable;

__ds_ns.StationRow = __ds_scope.StationRow;

__ds_ns.TierHeader = __ds_scope.TierHeader;

__ds_ns.BottomSheet = __ds_scope.BottomSheet;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.ThemePicker = __ds_scope.ThemePicker;

__ds_ns.DetectorStrip = __ds_scope.DetectorStrip;

__ds_ns.LivePulse = __ds_scope.LivePulse;

__ds_ns.ReceiverRow = __ds_scope.ReceiverRow;

__ds_ns.StatusLine = __ds_scope.StatusLine;

__ds_ns.TransportBar = __ds_scope.TransportBar;

__ds_ns.WaterfallPanel = __ds_scope.WaterfallPanel;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.DetailHeader = __ds_scope.DetailHeader;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.DirectoryRow = __ds_scope.DirectoryRow;

__ds_ns.AlertSwitch = __ds_scope.AlertSwitch;

__ds_ns.CoverageNote = __ds_scope.CoverageNote;

__ds_ns.ScheduleRow = __ds_scope.ScheduleRow;

})();
