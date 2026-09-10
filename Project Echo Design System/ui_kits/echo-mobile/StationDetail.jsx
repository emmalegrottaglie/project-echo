const { DetailHeader, DetailList, ProvenanceTable, GapNotice, Flag } = window.ProjectEchoDesignSystem_453425;

const TIER_LABEL = { live: 'Live marker', scheduled: 'Scheduled', historical: 'Historical' };

/**
 * Full-screen push, not a sheet: provenance tables, lore, hearings and archive links
 * are too much for a sheet. Roster-only entries replace the tables with the stated gap.
 */
function StationDetail({ station, links, onBack }) {
  const rosterOnly = !station.lore;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', background: 'var(--bg)', animation: 'echo-push var(--dur-slow) var(--ease-out) both' }}>
      <DetailHeader designator={station.id} name={station.name} tier={TIER_LABEL[station.tier]} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <DetailList
          items={[
            { label: 'Classification', value: station.classification },
            { label: 'Operator', value: station.operator },
            { label: 'Status', value: `${TIER_LABEL[station.tier]}, ${station.lastConfirmed ? 'last confirmed ' + station.lastConfirmed : 'never confirmed'}` },
            ...(station.marker ? [{ label: 'Marker', value: station.marker }] : []),
            ...(station.aliases && station.aliases.length ? [{ label: 'Also known as', value: station.aliases.join(', ') }] : []),
          ]}
        />

        {rosterOnly ? (
          <GapNotice title="Roster entry" links={links}>
            The designator, name, operator and status are sourced; frequencies, schedules and history have not been imported yet.
          </GapNotice>
        ) : (
          <React.Fragment>
            <p style={{ margin: 0, color: 'var(--fg)', font: 'var(--text-body)/var(--leading-body) var(--font-sans)', textWrap: 'pretty' }}>{station.lore}</p>

            {station.frequencies.length > 0 && (
              <section>
                <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--dim)', font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>
                  Frequencies {station.disputed && <Flag>sources disagree</Flag>}
                </h4>
                <ProvenanceTable rows={station.frequencies} />
              </section>
            )}

            <section>
              <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--dim)', font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>
                Heard here
              </h4>
              {station.hearings && station.hearings.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--fg)', font: 'var(--text-label)/var(--leading-data) var(--font-mono)' }}>
                  <thead>
                    <tr>
                      {['When', 'kHz', 'Period', 'Receiver'].map((headCell) => (
                        <th key={headCell} style={{ textAlign: 'left', padding: 'var(--space-1) var(--space-2) var(--space-1) 0', borderBottom: '1px solid var(--border)', color: 'var(--dim)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>{headCell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {station.hearings.map((hearing) => (
                      <tr key={hearing.when}>
                        <td style={{ padding: 'var(--space-1) var(--space-2) var(--space-1) 0', borderBottom: '1px solid var(--border)' }}>{hearing.when}</td>
                        <td style={{ padding: 'var(--space-1) var(--space-2) var(--space-1) 0', borderBottom: '1px solid var(--border)' }}>{hearing.khz}</td>
                        <td style={{ padding: 'var(--space-1) var(--space-2) var(--space-1) 0', borderBottom: '1px solid var(--border)' }}>{hearing.periodSec.toFixed(2)} s</td>
                        <td style={{ padding: 'var(--space-1) var(--space-2) var(--space-1) 0', borderBottom: '1px solid var(--border)' }}>{hearing.receiver}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <GapNotice>
                  No hearings recorded yet. The live view records one when the detector locks onto this station's marker — timing and frequency only, never any content.
                </GapNotice>
              )}
            </section>

            <section>
              <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--dim)', font: 'var(--weight-medium) var(--text-label)/1.4 var(--font-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>
                Recordings and logs
              </h4>
              <GapNotice links={links}>
                Searches on the established archives. This app hosts no message recordings: publishing the contents of non-broadcast transmissions is the regulated act, and the hobby groups have curated these for decades.
              </GapNotice>
            </section>
          </React.Fragment>
        )}
      </div>
      <style>{`
        @keyframes echo-push { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @media (prefers-reduced-motion: reduce) { @keyframes echo-push { from { opacity: 0 } to { opacity: 1 } } }
      `}</style>
    </div>
  );
}

Object.assign(window, { StationDetail });
