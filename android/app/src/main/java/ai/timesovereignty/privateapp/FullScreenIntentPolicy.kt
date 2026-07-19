package ai.timesovereignty.privateapp

enum class FullScreenIntentAccessState {
    READY,
    NEEDS_USER_APPROVAL
}

object FullScreenIntentPolicy {
    private const val EXPLICIT_ACCESS_SDK = 34

    fun evaluate(sdkInt: Int, systemAllowsFullScreenIntent: Boolean): FullScreenIntentAccessState =
        if (sdkInt < EXPLICIT_ACCESS_SDK || systemAllowsFullScreenIntent) {
            FullScreenIntentAccessState.READY
        } else {
            FullScreenIntentAccessState.NEEDS_USER_APPROVAL
        }
}
