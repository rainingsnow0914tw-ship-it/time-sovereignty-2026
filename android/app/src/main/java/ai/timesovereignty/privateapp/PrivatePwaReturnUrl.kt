package ai.timesovereignty.privateapp

import java.net.URI

object PrivatePwaReturnUrl {
    fun build(baseUrl: String): String? {
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
            "profile=play",
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
