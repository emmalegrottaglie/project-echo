type HapticsPlugin = typeof import('@capacitor/haptics').Haptics;

/**
 * The plugin itself never crosses an `await`: a Capacitor plugin is a `Proxy` whose
 * catch-all trap answers *any* property, including `.then`. Returned across an async
 * boundary, the engine's thenable check sees that `.then` and calls it as a resolver,
 * which throws inside Capacitor's stub and hangs the awaiting caller forever. The loader
 * below hands back only a boolean; the plugin stays in this module-scoped variable.
 */
let plugin: HapticsPlugin | null = null;
let ready: Promise<boolean> | null = null;

async function ensureLoaded(): Promise<boolean> {
  ready ??= (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return false;
      const module = await import('@capacitor/haptics');
      plugin = module.Haptics;
      return true;
    } catch {
      return false;
    }
  })();
  return ready;
}

export async function tick(): Promise<void> {
  if (!(await ensureLoaded()) || !plugin) return;
  try {
    const { ImpactStyle } = await import('@capacitor/haptics');
    await plugin.impact({ style: ImpactStyle.Light });
  } catch {
    // Ignore: a missed buzz is not worth surfacing.
  }
}

export async function confirm(): Promise<void> {
  if (!(await ensureLoaded()) || !plugin) return;
  try {
    const { NotificationType } = await import('@capacitor/haptics');
    await plugin.notification({ type: NotificationType.Success });
  } catch {
    // Ignore: a missed buzz is not worth surfacing.
  }
}
