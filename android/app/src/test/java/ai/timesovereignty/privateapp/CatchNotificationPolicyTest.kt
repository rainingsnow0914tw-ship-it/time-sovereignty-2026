package ai.timesovereignty.privateapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class CatchNotificationPolicyTest {
    @Test
    fun `level one remains passive so it cannot consume the later full-screen opportunity`() {
        val plan = CatchNotificationPolicy.forLevel(1)

        assertEquals(CatchNotificationChannelTier.PASSIVE_MESSAGE, plan.channelTier)
        assertFalse(plan.isInteractive)
        assertFalse(plan.playBoundedPromptSignal)
        assertFalse(plan.attachFullScreenIntent)
    }

    @Test
    fun `level two uses a bounded signal without claiming the full-screen surface`() {
        val plan = CatchNotificationPolicy.forLevel(2)

        assertEquals(CatchNotificationChannelTier.PASSIVE_PROMPT, plan.channelTier)
        assertTrue(plan.isInteractive)
        assertTrue(plan.playBoundedPromptSignal)
        assertFalse(plan.attachFullScreenIntent)
    }

    @Test
    fun `level four is the only full-screen call`() {
        val plan = CatchNotificationPolicy.forLevel(4)

        assertEquals(CatchNotificationChannelTier.FULL_SCREEN_CALL, plan.channelTier)
        assertTrue(plan.isInteractive)
        assertFalse(plan.playBoundedPromptSignal)
        assertTrue(plan.attachFullScreenIntent)
    }

    @Test
    fun `each escalation tier has a stable distinct notification identity`() {
        val eventId = "live-bridge-check-in"

        val levelOne = CatchNotifications.notificationId(eventId, 1)
        val levelTwo = CatchNotifications.notificationId(eventId, 2)
        val levelFour = CatchNotifications.notificationId(eventId, 4)

        assertEquals(levelOne, CatchNotifications.notificationId(eventId, 1))
        assertEquals(3, setOf(levelOne, levelTwo, levelFour).size)
    }

    @Test
    fun `unsupported levels fail closed`() {
        assertThrows(IllegalStateException::class.java) {
            CatchNotificationPolicy.forLevel(3)
        }
    }
}
