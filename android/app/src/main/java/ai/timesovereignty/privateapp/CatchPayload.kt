package ai.timesovereignty.privateapp

data class CatchPayload(
    val eventId: String,
    val level: Int,
    val title: String,
    val message: String,
    val responseUrl: String?,
    val expiresAt: String?
) {
    val isFullScreen: Boolean get() = level == 4

    companion object {
        fun from(data: Map<String, String>): CatchPayload? {
            val eventId = data["event_id"]?.trim().orEmpty()
            val level = data["level"]?.toIntOrNull()
            if (eventId.isEmpty() || level !in setOf(1, 2, 4)) return null

            return CatchPayload(
                eventId = eventId,
                level = level!!,
                title = data["title"]?.take(120) ?: "澄來找妳了",
                message = data["message"]?.take(1_000) ?: "我們原本約好的時間到了。現在真實情況是什麼？",
                responseUrl = data["response_url"],
                expiresAt = data["expires_at"]
            )
        }
    }
}
