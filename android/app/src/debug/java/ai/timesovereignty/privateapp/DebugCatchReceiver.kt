package ai.timesovereignty.privateapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class DebugCatchReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION) return
        CatchNotifications.show(
            context,
            CatchPayload(
                eventId = "debug-${System.currentTimeMillis()}",
                level = 4,
                title = "澄來找妳了 · 本機驗收",
                message = "這次不連雲端，也不呼叫 GPT-5.6；只驗證鎖屏喚醒、鈴聲與震動。",
                responseUrl = null,
                expiresAt = null
            )
        )
    }

    companion object {
        const val ACTION = "ai.timesovereignty.privateapp.DEBUG_LOCAL_CATCH"
    }
}
