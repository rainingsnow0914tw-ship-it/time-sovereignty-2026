package ai.timesovereignty.privateapp

import android.content.Context

object CatchAttentionSignal {
    private const val PROMPT_SIGNAL_DURATION_MS = 2_500L
    private const val CALL_SIGNAL_MAXIMUM_DURATION_MS = 30_000L
    private var promptRinger: BoundedRinger? = null
    private var callRinger: BoundedRinger? = null

    @Synchronized
    fun playPrompt(context: Context) {
        stopPrompt()
        promptRinger = BoundedRinger(context.applicationContext).also {
            it.start(PROMPT_SIGNAL_DURATION_MS)
        }
    }

    @Synchronized
    fun stopPrompt() {
        promptRinger?.stop()
        promptRinger = null
    }

    @Synchronized
    fun playCall(context: Context) {
        stopAll()
        callRinger = BoundedRinger(context.applicationContext).also {
            // This is a hard safety cap, not an expected interaction time.
            // A missed call can never ring indefinitely.
            it.start(CALL_SIGNAL_MAXIMUM_DURATION_MS)
        }
    }

    @Synchronized
    fun stopAll() {
        promptRinger?.stop()
        promptRinger = null
        callRinger?.stop()
        callRinger = null
    }
}
