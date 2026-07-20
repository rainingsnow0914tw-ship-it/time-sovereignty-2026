package ai.timesovereignty.privateapp

import java.net.URI

object PrivatePwaReturnUrl {
    fun build(baseUrl: String): String? = buildWithQuery(baseUrl, "profile=play")

    // Answering an incoming check-in lands on the private journey with the
    // natural-voice control armed, so the user speaks instead of typing. A
    // browser still requires one tap before it may open the microphone, so this
    // arms the control; it cannot start the microphone on its own.
    fun buildVoiceAnswer(baseUrl: String): String? =
        buildWithQuery(baseUrl, "profile=play&answer=voice")

    private fun buildWithQuery(baseUrl: String, query: String): String? {
        val base = runCatching { URI(baseUrl.trim()) }.getOrNull() ?: return null
        if (
            base.scheme != "https" ||
            base.host.isNullOrBlank() ||
            base.userInfo != null ||
            base.port !in setOf(-1, 443)
        ) {
            return null
        }

        return URI(
            "https",
            null,
            base.host,
            base.port,
            "/",
            query,
            null
        ).toASCIIString()
    }
}

object PrivatePwaHandlerSelector {
    private const val CHROME_PACKAGE = "com.android.chrome"
    private const val CHROME_WEBAPK_PREFIX = "org.chromium.webapk."

    fun choose(packages: List<String>): String? =
        packages.firstOrNull { it.startsWith(CHROME_WEBAPK_PREFIX) }
            ?: packages.firstOrNull { it == CHROME_PACKAGE }
}
