package ai.timesovereignty.privateapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color

object CatchNotifications {
    private const val LEVEL_ONE_CHANNEL = "time_sovereignty_message"
    private const val LEVEL_TWO_CHANNEL = "time_sovereignty_prompt"
    private const val LEVEL_FOUR_CHANNEL = "time_sovereignty_call"

    fun show(context: Context, payload: CatchPayload) {
        val manager = context.getSystemService(NotificationManager::class.java)
        ensureChannels(manager)

        val target = if (payload.isInteractive) {
            IncomingCheckInActivity.intent(context, payload)
        } else {
            Intent(context, MainActivity::class.java).apply {
                putExtra("event_id", payload.eventId)
                putExtra("level", payload.level)
                putExtra("title", payload.title)
                putExtra("message", payload.message)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            payload.eventId.hashCode(),
            target,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = Notification.Builder(context, channelFor(payload.level))
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(payload.title)
            .setContentText(payload.message)
            .setStyle(Notification.BigTextStyle().bigText(payload.message))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setCategory(if (payload.isFullScreen) Notification.CATEGORY_CALL else Notification.CATEGORY_REMINDER)

        if (payload.isFullScreen) {
            builder.setOngoing(true).setFullScreenIntent(pendingIntent, true)
        }

        manager.notify(payload.eventId.hashCode(), builder.build())
    }

    fun cancel(context: Context, eventId: String) {
        context.getSystemService(NotificationManager::class.java).cancel(eventId.hashCode())
    }

    private fun channelFor(level: Int): String = when (level) {
        1 -> LEVEL_ONE_CHANNEL
        2 -> LEVEL_TWO_CHANNEL
        else -> LEVEL_FOUR_CHANNEL
    }

    private fun ensureChannels(manager: NotificationManager) {
        manager.createNotificationChannel(
            NotificationChannel(LEVEL_ONE_CHANNEL, "溫和報到", NotificationManager.IMPORTANCE_DEFAULT)
        )
        manager.createNotificationChannel(
            NotificationChannel(LEVEL_TWO_CHANNEL, "互動式跟進", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "重要承諾尚未回應時的第二次跟進"
            }
        )
        manager.createNotificationChannel(
            NotificationChannel(LEVEL_FOUR_CHANNEL, "澄的即時來電", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "只在明確同意的高優先承諾中使用"
                enableLights(true)
                lightColor = Color.rgb(58, 125, 104)
                lockscreenVisibility = Notification.VISIBILITY_PRIVATE
            }
        )
    }
}
