package ai.timesovereignty.privateapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PrivatePwaReturnUrlTest {
    @Test
    fun `builds the exact private play profile root`() {
        assertEquals(
            "https://live-mobile.example.test/?profile=play",
            PrivatePwaReturnUrl.build("https://live-mobile.example.test")
        )
    }

    @Test
    fun `removes stale paths queries and fragments`() {
        assertEquals(
            "https://live-mobile.example.test/?profile=play",
            PrivatePwaReturnUrl.build(
                "https://live-mobile.example.test/old/path?profile=default#stale"
            )
        )
    }

    @Test
    fun `refuses insecure or credential bearing origins`() {
        assertNull(PrivatePwaReturnUrl.build("http://live-mobile.example.test"))
        assertNull(PrivatePwaReturnUrl.build("https://user@live-mobile.example.test"))
        assertNull(PrivatePwaReturnUrl.build("not a URL"))
    }

    @Test
    fun `prefers the installed Chrome WebAPK over browsers`() {
        assertEquals(
            "org.chromium.webapk.private_v2",
            PrivatePwaHandlerSelector.choose(
                listOf(
                    "com.sec.android.app.sbrowser",
                    "com.android.chrome",
                    "org.chromium.webapk.private_v2"
                )
            )
        )
    }

    @Test
    fun `falls back to Chrome when the WebAPK is absent`() {
        assertEquals(
            "com.android.chrome",
            PrivatePwaHandlerSelector.choose(
                listOf("com.sec.android.app.sbrowser", "com.android.chrome")
            )
        )
        assertNull(PrivatePwaHandlerSelector.choose(listOf("com.sec.android.app.sbrowser")))
    }

    @Test
    fun `answering by voice keeps the play profile and arms the voice layer`() {
        assertEquals(
            "https://live-mobile.example.test/?profile=play&answer=voice",
            PrivatePwaReturnUrl.buildVoiceAnswer("https://live-mobile.example.test")
        )
    }

    @Test
    fun `voice answer applies the same origin safety rules`() {
        assertNull(PrivatePwaReturnUrl.buildVoiceAnswer("http://live-mobile.example.test"))
        assertNull(PrivatePwaReturnUrl.buildVoiceAnswer("https://user@live-mobile.example.test"))
        assertNull(PrivatePwaReturnUrl.buildVoiceAnswer("not a URL"))
    }
}
