const { BottomSheet, DirectoryRow, SearchField, Skeleton, ReceiverRow, Flag, Button } = window.ProjectEchoDesignSystem_453425;

function ReceiverSheet({ receivers, selectedId, onSelect, onBrowse, onDismiss }) {
  return (
    <BottomSheet title="Receiver" note="Saved in this browser. Your audio connection goes straight to that node, under that node's own rules." onDismiss={onDismiss} height="72%">
      {receivers.map((receiver) => (
        <button
          key={receiver.id}
          type="button"
          onClick={() => onSelect(receiver.id)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', width: '100%',
            minHeight: 'var(--touch-min)', padding: 'var(--space-2) 0', border: 0,
            borderBottom: '1px solid var(--border)', background: 'transparent', textAlign: 'left', cursor: 'pointer',
          }}
        >
          <span>
            <span style={{ display: 'block', color: 'var(--fg)', font: 'var(--text-body)/var(--leading-data) var(--font-sans)' }}>{receiver.label}</span>
            <span style={{ display: 'block', color: 'var(--dim)', font: 'var(--text-label)/1.4 var(--font-mono)' }}>{receiver.grid}</span>
          </span>
          {receiver.id === selectedId && <Flag>selected</Flag>}
        </button>
      ))}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
        <Button onClick={onBrowse}>Browse directory</Button>
        <Button variant="ghost">Add by host</Button>
      </div>
    </BottomSheet>
  );
}

function StationSheet({ stations, selectedId, onSelect, onDismiss }) {
  return (
    <BottomSheet title="Station" note="Only the three continuously-transmitting Russian markers are offered here. Scheduled stations live on the Schedule tab." onDismiss={onDismiss} height="72%">
      {stations.filter((s) => s.tier === 'live').flatMap((station) =>
        (station.frequencies.length ? station.frequencies : [null]).map((frequency, index) => (
          <button
            key={station.id + index}
            type="button"
            onClick={() => onSelect(station.id, index)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', width: '100%',
              minHeight: 'var(--touch-min)', padding: 'var(--space-2) 0', border: 0,
              borderBottom: '1px solid var(--border)', background: 'transparent', textAlign: 'left', cursor: 'pointer',
            }}
          >
            <span>
              <span style={{ display: 'block', color: 'var(--fg)', font: 'var(--text-body)/var(--leading-data) var(--font-mono)' }}>
                <span style={{ color: 'var(--accent)' }}>{station.id}</span> {station.name}
              </span>
              <span style={{ display: 'block', color: 'var(--dim)', font: 'var(--text-label)/1.4 var(--font-mono)' }}>
                {frequency ? `${frequency.khz} kHz ${frequency.mode}${frequency.timeOfDay ? ' (' + frequency.timeOfDay + ')' : ''}` : 'no frequency imported'}
              </span>
            </span>
            {frequency && frequency.disputed && <Flag>disputed</Flag>}
          </button>
        )),
      )}
    </BottomSheet>
  );
}

function DirectorySheet({ loading, rows, total, query, onQuery, onAdopt, onDismiss }) {
  const shown = rows.filter((row) => row.location.toLowerCase().includes(query.toLowerCase()));
  return (
    <BottomSheet
      title="Public receivers"
      note={`Showing ${shown.length} of ${total} receivers covering 4625 kHz with a free channel. Source: rx.linkfanel.net, sorted by reported SNR.`}
      onDismiss={onDismiss}
    >
      <div style={{ paddingBottom: 'var(--space-3)' }}>
        <SearchField value={query} onChange={onQuery} placeholder="Search location" />
      </div>
      {loading ? <Skeleton rows={3} /> : shown.map((row) => (
        <DirectoryRow key={row.location} {...row} onAdopt={() => onAdopt(row)} />
      ))}
    </BottomSheet>
  );
}

Object.assign(window, { ReceiverSheet, StationSheet, DirectorySheet });
