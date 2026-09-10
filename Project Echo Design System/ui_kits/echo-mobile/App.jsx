const { AppHeader, TabBar } = window.ProjectEchoDesignSystem_453425;
const { LiveScreen, ScheduleScreen, ArchiveScreen, StationDetail, ReceiverSheet, StationSheet, DirectorySheet } = window;
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
  const [alerts, setAlerts] = React.useState({ 0: true });

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const receiver = receivers.find((candidate) => candidate.id === receiverId) || null;
  const station = DATA.stations.find((candidate) => candidate.id === stationId);
  const frequency = station.frequencies[frequencyIndex] || station.frequencies[0] || null;
  const detail = detailId ? DATA.stations.find((candidate) => candidate.id === detailId) : null;

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

  return (
    <div style={{ position: 'relative', width: 393, height: 852, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <AppHeader theme={theme} onThemeChange={setTheme} />

      <main key={tab} style={{ flex: '1 1 auto', minHeight: 0, animation: 'echo-tab var(--dur-base) var(--ease-out) both' }}>
        {tab === 'live' && (
          <LiveScreen
            receiver={receiver}
            station={station}
            frequency={frequency}
            phase={phase}
            detector={detector}
            serverPresent
            onOpenReceiver={() => setSheet('receiver')}
            onOpenStation={() => setSheet('station')}
            onConnect={connect}
            onStop={stop}
            onSynthetic={synthetic}
          />
        )}
        {tab === 'schedule' && (
          <ScheduleScreen
            rows={DATA.schedule}
            permission={permission}
            alerts={alerts}
            onAskPermission={() => setPermission('granted')}
            onToggleAlert={(index) => setAlerts((current) => ({ ...current, [index]: !current[index] }))}
          />
        )}
        {tab === 'archive' && (
          <ArchiveScreen
            stations={DATA.stations}
            query={query}
            tier={tier}
            onQuery={setQuery}
            onTier={setTier}
            onOpen={setDetailId}
          />
        )}
      </main>

      <TabBar value={tab} onChange={(next) => { setTab(next); setDetailId(null); }} />

      {detail && <StationDetail station={detail} links={DATA.archiveLinks} onBack={() => setDetailId(null)} />}

      {sheet === 'receiver' && (
        <ReceiverSheet
          receivers={receivers}
          selectedId={receiverId}
          onSelect={(id) => { setReceiverId(id); setSheet(null); }}
          onBrowse={openDirectory}
          onDismiss={() => setSheet(null)}
        />
      )}
      {sheet === 'station' && (
        <StationSheet
          stations={DATA.stations}
          selectedId={stationId}
          onSelect={(id, index) => { setStationId(id); setFrequencyIndex(index); setSheet(null); }}
          onDismiss={() => setSheet(null)}
        />
      )}
      {sheet === 'directory' && (
        <DirectorySheet
          loading={directoryLoading}
          rows={DATA.directory}
          total={DATA.directoryTotal}
          query={directoryQuery}
          onQuery={setDirectoryQuery}
          onAdopt={(row) => {
            setReceivers((current) => current.some((r) => r.id === row.location) ? current : [...current, { id: row.location, label: row.location, grid: row.grid, location: row.location }]);
            setReceiverId(row.location);
            setSheet(null);
          }}
          onDismiss={() => setSheet(null)}
        />
      )}

      <style>{`
        @keyframes echo-tab { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @media (prefers-reduced-motion: reduce) { @keyframes echo-tab { from { opacity: 0 } to { opacity: 1 } } }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
