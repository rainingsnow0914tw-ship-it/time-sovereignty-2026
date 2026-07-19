type ConfirmationCandidate = {
  id: string;
  status: string;
};

export function findRecoveredConfirmation<T extends ConfirmationCandidate>(
  payload: {
    checkIn: T | null;
    lastConfirmedCheckIn: T | null;
  },
  expectedCheckInId: string,
): T | null {
  const candidates = [payload.checkIn, payload.lastConfirmedCheckIn];
  return (
    candidates.find(
      (candidate) =>
        candidate?.id === expectedCheckInId && candidate.status === "CONFIRMED",
    ) ?? null
  );
}
