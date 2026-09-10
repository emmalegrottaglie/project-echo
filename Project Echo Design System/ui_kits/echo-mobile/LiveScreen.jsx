const { ReceiverRow, WaterfallPanel, DetectorStrip, StatusLine, TransportBar, GapNotice, Flag, Button } = window.ProjectEchoDesignSystem_453425;

/**
 * Live view, phone order: receiver row, station row, full-bleed waterfall, detector
 * strip, then the fixed transport bar above the tab bar. Propagation and diagnostics
 * are collapsed below the fold.
 */
function LiveScreen({ receiver, station, frequency, phase, detector, onOpenReceiver, onOpenStation, onConnect, onStop, onSynthetic, serverPresent }) {
  const connected = phase === 'running';

  const status = {
    idle: { message: 'idle', tone: 'neutral' },
    connecting: { message: `connecting to ${receiver ? receiver.label : '—'}…`, tone: 'neutral' },
    running: { message: `running — ${receiver ? receiver.label + ' · ' + receiver.grid : 'synthetic marker'}`, tone: 'live' },
    stalled: { message: 'connected but no audio reached the analyser — all channels may be busy', tone: 'danger' },
  }[phase];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        {receiver ? (
          <ReceiverRow label="Receiver" value={receiver.label} meta={`· ${receiver.grid}`} onOpen={onOpenReceiver} />
        ) : (
          <div style={{ padding: 'var(--space-4)' }}>
            <GapNotice title="No receiver saved">
              Pick a public KiwiSDR with propagation to the transmitter. Saving one only stores its address in this browser; the connection goes straight to that node.
            </GapNotice>
            <div style={{ paddingTop: 'var(--space-3)' }}>
              <Button variant="primary" onClick={onOpenReceiver}>Choose a receiver</Button>
            </div>
          </div>
        )}

        <ReceiverRow
          label="Station"
          value={`${station.id} ${station.name}`}
          meta={frequency ? `· ${frequency.khz} kHz ${frequency.mode}` : null}
          live={station.tier === 'live'}
          periodSec={station.periodSec || 2.4}
          flag={frequency && frequency.disputed ? <Flag>disputed</Flag> : null}
          onOpen={onOpenStation}
        />

        <div style={{ padding: 'var(--space-2) var(--space-4)' }}>
          <StatusLine
            message={status.message}
            tone={status.tone}
            action={phase === 'stalled' ? <Button variant="ghost" onClick={onOpenReceiver}>Try another</Button> : null}
          />
        </div>

        <WaterfallPanel rows={300} mock={connected ? (detector === 'detected' ? 'detected' : 'noise') : 'blank'} />
        <DetectorStrip
          state={connected ? detector : 'idle'}
          periodSec={detector === 'detected' ? 2.38 : undefined}
          perMinute={detector === 'detected' ? 25 : undefined}
          expectedSec={station.periodSec || undefined}
        />

        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <details>
            <summary style={{ color: 'var(--dim)', font: 'var(--text-label)/1.6 var(--font-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', cursor: 'pointer' }}>
              Propagation
            </summary>
            <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--dim)', font: 'var(--text-label)/var(--leading-body) var(--font-sans)', textWrap: 'pretty' }}>
              Maximum usable frequency, from prop.kc2g.com (IRI-2016 conditioned on live ionosonde data, regenerated every five minutes). If the station's frequency sits above the MUF on your path, the band is shut and the silence is the ionosphere, not the transmitter.
            </p>
          </details>
          {serverPresent && (
            <details>
              <summary style={{ color: 'var(--dim)', font: 'var(--text-label)/1.6 var(--font-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', cursor: 'pointer' }}>
                Diagnostics
              </summary>
              <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--dim)', font: 'var(--text-label)/var(--leading-body) var(--font-sans)', textWrap: 'pretty' }}>
                A fixed 30-second recording shaped like The Buzzer, served with and without CORS headers from the server's other loopback name. The first should give a waterfall and a detected 2.4 s period; the second should report silence.
              </p>
            </details>
          )}
          <p style={{ margin: 0, color: 'var(--dim)', font: 'var(--text-label)/var(--leading-body) var(--font-sans)', textWrap: 'pretty' }}>
            Live means live while this tab is in front — iOS suspends audio in the background. This app records observations about signals, never their contents.
          </p>
        </div>
      </div>

      <TransportBar
        running={connected || phase === 'stalled'}
        connecting={phase === 'connecting'}
        onConnect={onConnect}
        onStop={onStop}
        onSynthetic={onSynthetic}
        showSynthetic={serverPresent}
      />
    </div>
  );
}

Object.assign(window, { LiveScreen });
