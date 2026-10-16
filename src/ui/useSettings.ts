import { useSyncExternalStore } from 'react';
import { settings, type Settings } from '../storage/settings';

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const s = useSyncExternalStore(settings.subscribe, settings.get, settings.get);
  return [s, settings.set];
}
