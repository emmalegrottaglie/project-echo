const { SearchField, SegmentedControl, StationRow, TierHeader, GapNotice } = window.ProjectEchoDesignSystem_453425;

const TIER_LABEL = { live: 'Live markers', scheduled: 'Scheduled', historical: 'Historical' };

/** 141 rows in the real app; the fixture carries 12. Section headers by tier when unfiltered. */
function ArchiveScreen({ stations, query, tier, onQuery, onTier, onOpen }) {
  const matched = stations.filter((station) => {
    if (tier && station.tier !== tier) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return station.id.toLowerCase().includes(q) || station.name.toLowerCase().includes(q) || station.operator.toLowerCase().includes(q);
  });

  const groups = tier
    ? [[tier, matched]]
    : ['live', 'scheduled', 'historical'].map((t) => [t, matched.filter((s) => s.tier === t)]).filter(([, list]) => list.length);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <SearchField value={query} onChange={onQuery} />
        <SegmentedControl
          value={tier}
          onChange={onTier}
          options={[
            { value: '', label: 'All' },
            { value: 'live', label: 'Live' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'historical', label: 'Historical' },
          ]}
        />
        <p style={{ margin: 0, color: 'var(--dim)', font: 'var(--text-label)/var(--leading-body) var(--font-sans)' }}>
          141 stations — 3 live markers, 26 scheduled, 112 historical. Status is shown as a dated claim, because most published "active" listings are stale.
        </p>
      </div>

      {matched.length === 0 ? (
        <div style={{ padding: 'var(--space-4)' }}>
          <GapNotice title="No station matches">
            Nothing in the roster matches that search. Designators are the reliable key — try "S28", "Buzzer", or an operator name.
          </GapNotice>
        </div>
      ) : (
        groups.map(([groupTier, list]) => (
          <div key={groupTier}>
            <TierHeader label={TIER_LABEL[groupTier]} count={list.length} />
            {list.map((station) => (
              <StationRow
                key={station.id}
                designator={station.id}
                name={station.name}
                operator={station.operator}
                tier={station.tier}
                periodSec={station.periodSec}
                disputed={station.disputed}
                onOpen={() => onOpen(station.id)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

Object.assign(window, { ArchiveScreen });
