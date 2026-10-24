import { captureNativeRecovery } from '@/features/password-recovery/nativeRecovery';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  // Read the raw link before Expo Router normalizes it and drops the fragment.
  return captureNativeRecovery(path) ?? path;
}
