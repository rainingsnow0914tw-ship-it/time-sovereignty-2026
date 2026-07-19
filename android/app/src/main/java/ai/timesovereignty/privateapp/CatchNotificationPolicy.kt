package ai.timesovereignty.privateapp

enum class CatchNotificationChannelTier {
    PASSIVE_MESSAGE,
    PASSIVE_PROMPT,
    FULL_SCREEN_CALL
}

data class CatchNotificationPlan(
    val channelTier: CatchNotificationChannelTier,
    val isInteractive: Boolean,
    val playBoundedPromptSignal: Boolean,
    val attachFullScreenIntent: Boolean
)

object CatchNotificationPolicy {
    fun forLevel(level: Int): CatchNotificationPlan = when (level) {
        1 -> CatchNotificationPlan(
            channelTier = CatchNotificationChannelTier.PASSIVE_MESSAGE,
            isInteractive = false,
            playBoundedPromptSignal = false,
            attachFullScreenIntent = false
        )

        2 -> CatchNotificationPlan(
            channelTier = CatchNotificationChannelTier.PASSIVE_PROMPT,
            isInteractive = true,
            playBoundedPromptSignal = true,
            attachFullScreenIntent = false
        )

        4 -> CatchNotificationPlan(
            channelTier = CatchNotificationChannelTier.FULL_SCREEN_CALL,
            isInteractive = true,
            playBoundedPromptSignal = false,
            attachFullScreenIntent = true
        )

        else -> error("Unsupported catch notification level: $level")
    }
}
