import type { LiveReplyRequest } from "../live-checkin/schemas";
import type { CatchResponse } from "./schemas";

export function catchResponseToLiveReply(response: CatchResponse): LiveReplyRequest {
  if (response.type === "timeout") {
    throw new Error("A timeout is a server event, not a user reply.");
  }
  const supplied = response.responseText?.trim();
  if (response.type === "complete") {
    return {
      replyId: response.responseId,
      intent: "REPORT_PROGRESS",
      reply: supplied || "I completed the action we agreed on.",
      image: null,
    };
  }
  if (response.type === "reschedule") {
    return {
      replyId: response.responseId,
      intent: "DELAY",
      reply:
        supplied ||
        `I need to delay this commitment by ${response.delayMinutes} minutes.`,
      image: null,
    };
  }
  if (response.type === "downgrade") {
    return {
      replyId: response.responseId,
      intent: "SOMETHING_CHANGED",
      reply: supplied || "The action is too large right now. Help me shrink it.",
      image: null,
    };
  }
  return {
    replyId: response.responseId,
    intent: "SOMETHING_CHANGED",
    reply: supplied || "I need rest today. Please pause pressure and help me recover safely.",
    image: null,
  };
}
