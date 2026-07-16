import type { JourneyState } from "../features/journey/model";
import { JourneyStateSchema } from "../features/journey/model";
import type { StorageLike } from "./local-onboarding-repository";

export const LOCAL_JOURNEY_STORAGE_PREFIX =
  "time-sovereignty.longitudinal-journey.v1";

export function createLocalJourneyRepository(
  storage: StorageLike,
  goalId: string,
) {
  const key = `${LOCAL_JOURNEY_STORAGE_PREFIX}.${goalId}`;

  return {
    load(): JourneyState | null {
      const serialized = storage.getItem(key);
      if (!serialized) return null;

      try {
        const parsed: unknown = JSON.parse(serialized);
        const validated = JourneyStateSchema.safeParse(parsed);
        return validated.success ? validated.data : null;
      } catch {
        return null;
      }
    },

    save(state: JourneyState): void {
      const validated = JourneyStateSchema.parse(state);
      storage.setItem(key, JSON.stringify(validated));
    },

    clear(): void {
      storage.removeItem(key);
    },
  };
}
