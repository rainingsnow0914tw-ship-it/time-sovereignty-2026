package ai.timesovereignty.privateapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build

object CatchNotifications {
    // Channel importance is immutable after creation. These v2 IDs intentionally
    // replace the earlier DEFAULT/HIGH channels that woke the screen before level 4.
    private const val LEVEL_ONE_CHANNEL = "time_sovereignty_message_v2"
    private const val LEVEL_TWO_CHANNEL = "time_sovereignty_prompt_v2"
    private const val LEVEL_FOUR_CHANNEL = "time_sovereignty_call"

    fun show(context: Context, payload: CatchPayload) {
        val manager = context.getSystemService(NotificationManager::class.java)
        ensureChannels(manager)
        val plan = CatchNotificationPolicy.forLevel(payload.level)
        val notificationId = notificationId(payload.eventId, payload.level)

        // Samsung treats changing an existing low-priority notification into a
        // full-screen call as an update, and does not launch the newly attached
        // full-screen intent. Remove earlier tiers and post level 4 under its own
        // identity so the OS receives a genuinely new call notification.
        cancelEarlierTiers(manager, payload.eventId, payload.level)

        val target = if (plan.isInteractive) {
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
            notificationId,
            target,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = Notification.Builder(context, channelFor(plan.channelTier))
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(payload.title)
            .setContentText(payload.message)
            .setStyle(Notification.BigTextStyle().bigText(payload.message))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setCategory(if (plan.attachFullScreenIntent) Notification.CATEGORY_CALL else Notification.CATEGORY_REMINDER)

        if (plan.attachFullScreenIntent) {
            CatchAttentionSignal.stopPrompt()
            builder.setOngoing(true)
            val systemAllows = Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE ||
                manager.canUseFullScreenIntent()
            if (
                FullScreenIntentPolicy.evaluate(Build.VERSION.SDK_INT, systemAllows) ==
                FullScreenIntentAccessState.READY
            ) {
                builder.setFullScreenIntent(pendingIntent, true)
            }
        } else if (plan.playBoundedPromptSignal) {
            CatchAttentionSignal.playPrompt(context)
        }

        manager.notify(notificationId, builder.build())
    }

    fun cancel(context: Context, eventId: String) {
        val manager = context.getSystemService(NotificationManager::class.java)
        // Also clear the legacy single-id notification from APKs installed
        // before tier-specific identities were introduced.
        manager.cancel(eventId.hashCode())
        listOf(1, 2, 4).forEach { level ->
            manager.cancel(notificationId(eventId, level))
        }
    }

    fun cancelAll(context: Context) {
        CatchAttentionSignal.stopAll()
        context.getSystemService(NotificationManager::class.java).cancelAll()
    }

    internal fun notificationId(eventId: String, level: Int): Int =
        "$eventId:level:$level".hashCode()

    private fun cancelEarlierTiers(
        manager: NotificationManager,
        eventId: String,
        level: Int
    ) {
        manager.cancel(eventId.hashCode())
        when (level) {
            2 -> manager.cancel(notificationId(eventId, 1))
            4 -> listOf(1, 2).forEach { earlier ->
                manager.cancel(notificationId(eventId, earlier))
            }
        }
    }

    private fun channelFor(tier: CatchNotificationChannelTier): String = when (tier) {
        CatchNotificationChannelTier.PASSIVE_MESSAGE -> LEVEL_ONE_CHANNEL
        CatchNotificationChannelTier.PASSIVE_PROMPT -> LEVEL_TWO_CHANNEL
        CatchNotificationChannelTier.FULL_SCREEN_CALL -> LEVEL_FOUR_CHANNEL
    }

    private fun ensureChannels(manager: NotificationManager) {
        manager.createNotificationChannel(
            NotificationChannel(LEVEL_ONE_CHANNEL, "溫和報到", NotificationManager.IMPORTANCE_LOW).apply {
                description = "不喚醒螢幕的第一級承諾提醒"
                setSound(null, null)
                enableVibration(false)
            }
        )
        manager.createNotificationChannel(
            NotificationChannel(LEVEL_TWO_CHANNEL, "互動式跟進", NotificationManager.IMPORTANCE_LOW).apply {
                description = "第二級跟進；短促提示由 App 播放，不提前喚醒螢幕"
                setSound(null, null)
                enableVibration(false)
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
