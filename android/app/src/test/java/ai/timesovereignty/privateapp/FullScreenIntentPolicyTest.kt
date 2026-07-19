package ai.timesovereignty.privateapp

import org.junit.Assert.assertEquals
import org.junit.Test

class FullScreenIntentPolicyTest {
    @Test
    fun `pre Android 14 devices do not require the new special access`() {
        assertEquals(
            FullScreenIntentAccessState.READY,
            FullScreenIntentPolicy.evaluate(33, systemAllowsFullScreenIntent = false)
        )
    }

    @Test
    fun `Android 14 and newer require the system grant`() {
        assertEquals(
            FullScreenIntentAccessState.NEEDS_USER_APPROVAL,
            FullScreenIntentPolicy.evaluate(34, systemAllowsFullScreenIntent = false)
        )
        assertEquals(
            FullScreenIntentAccessState.NEEDS_USER_APPROVAL,
            FullScreenIntentPolicy.evaluate(36, systemAllowsFullScreenIntent = false)
        )
    }

    @Test
    fun `Android 14 and newer are ready after explicit approval`() {
        assertEquals(
            FullScreenIntentAccessState.READY,
            FullScreenIntentPolicy.evaluate(36, systemAllowsFullScreenIntent = true)
        )
    }
}
