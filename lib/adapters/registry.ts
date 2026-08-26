import type { JobSourceAdapter, SourceType } from "./types";
import { telegramAdapter } from "./telegram";
import { naukriAdapter } from "./naukri";
import { wellfoundAdapter } from "./wellfound";
import { linkedinAdapter } from "./linkedin";
import { founditAdapter } from "./foundit";

export const adapterRegistry: Record<SourceType, JobSourceAdapter> = {
  telegram: telegramAdapter,
  naukri: naukriAdapter,
  wellfound: wellfoundAdapter,
  linkedin: linkedinAdapter,
  foundit: founditAdapter,
};

export function getAdapter(type: SourceType): JobSourceAdapter {
  const adapter = adapterRegistry[type];
  if (!adapter) throw new Error(`No adapter registered for source type "${type}"`);
  return adapter;
}
