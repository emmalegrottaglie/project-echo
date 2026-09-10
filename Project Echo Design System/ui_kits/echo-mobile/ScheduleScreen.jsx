const { CoverageNote, ScheduleRow, GapNotice, Button } = window.ProjectEchoDesignSystem_453425;

/** Upcoming windows, soonest first. Countdown is the row's emphasis. */
function ScheduleScreen({ rows, permission, alerts, onToggleAlert, onAskPermission }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <CoverageNote
        coverage="1 of 26 scheduled stations have imported schedules. Times are as published, in UTC. Several operators rotate frequencies month by month, so a slot that is silent on the listed frequency may simply have moved."
        permission={permission}
        action={permission === 'default' ? <Button onClick={onAskPermission}>Enable notifications</Button> : null}
      />
      {rows.length === 0 ? (
        <div style={{ padding: 'var(--space-4)' }}>
          <GapNotice title="No schedules imported">
            No schedules have been imported yet. This is a data gap, not a quiet band — Priyom publishes further slots that have not been parsed into the fixture.
          </GapNotice>
        </div>
      ) : (
        rows.map((row, index) => (
          <ScheduleRow
            key={index}
            designator={row.id}
            name={row.name}
            utc={row.utc}
            local={row.local}
            countdown={row.countdown}
            khz={row.khz}
            note={row.note}
            urgent={row.urgent}
            alertOn={!!alerts[index]}
            alertDisabled={permission === 'denied' || permission === 'unsupported'}
            onToggleAlert={() => onToggleAlert(index)}
          />
        ))
      )}
    </div>
  );
}

Object.assign(window, { ScheduleScreen });
