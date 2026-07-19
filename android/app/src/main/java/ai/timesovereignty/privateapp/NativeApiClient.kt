package ai.timesovereignty.privateapp

import android.os.Build
import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.time.Instant
import java.util.UUID
import java.util.concurrent.Executors

data class NativeDecision(
    val assessment: String,
    val userMessage: String,
    val adaptedCommitment: String,
    val nextFollowUpAt: String?,
    val requiresConfirmation: Boolean
)

object NativeApiClient {
    private val executor = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())

    fun pair(
        pairingTicket: String,
        fcmToken: String,
        callback: (Result<NativePairingSession>) -> Unit
    ) {
        executor.execute {
            val result = runCatching {
                val body = JSONObject()
                    .put("pairingTicket", pairingTicket)
                    .put("deviceLabel", "${Build.MANUFACTURER} ${Build.MODEL}")
                    .put("fcmToken", fcmToken)
                    .put("locale", "zh-TW")
                    .put("notificationConsent", true)
                    .put("fullScreenConsent", true)
                val response = postJson(
                    BuildConfig.PRIVATE_API_BASE_URL + "/api/live/native/pair",
                    body,
                    null
                )
                NativePairingSession(
                    deviceId = response.getString("deviceId"),
                    credential = response.getString("credential"),
                    expiresAt = response.getString("expiresAt")
                )
            }
            main.post { callback(result) }
        }
    }

    fun respond(
        responseUrl: String,
        eventId: String,
        responseType: String,
        responseId: String = UUID.randomUUID().toString(),
        session: NativePairingSession,
        callback: (Result<NativeDecision>) -> Unit
    ) {
        executor.execute {
            val result = runCatching {
                val safeUrl = validateResponseUrl(responseUrl, eventId)
                val body = JSONObject()
                    .put("eventId", eventId)
                    .put("responseId", responseId)
                    .put("type", responseType)
                    .put("responseText", JSONObject.NULL)
                    .put("energy", JSONObject.NULL)
                    .put(
                        "delayMinutes",
                        if (responseType == "reschedule") 10 else JSONObject.NULL
                    )
                    .put("respondedAt", Instant.now().toString())
                val response = postJson(safeUrl, body, session)
                val decision = response.getJSONObject("decision")
                NativeDecision(
                    assessment = decision.getString("assessment"),
                    userMessage = decision.getString("userMessage"),
                    adaptedCommitment = decision.getString("adaptedCommitment"),
                    nextFollowUpAt = decision.optString("nextFollowUpAt")
                        .takeIf { it.isNotBlank() && it != "null" },
                    requiresConfirmation = response.optBoolean("requiresConfirmation", true)
                )
            }
            main.post { callback(result) }
        }
    }

    private fun postJson(
        url: String,
        body: JSONObject,
        session: NativePairingSession?
    ): JSONObject {
        val connection = (URL(url)
            .openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 45_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            if (session != null) {
                setRequestProperty("Authorization", "Bearer ${session.credential}")
                setRequestProperty("X-Time-Sovereignty-Device", session.deviceId)
            }
        }
        try {
            connection.outputStream.use {
                it.write(body.toString().toByteArray(Charsets.UTF_8))
            }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (status !in 200..299) throw NativeApiException(status)
            return JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }

    private fun validateResponseUrl(responseUrl: String, eventId: String): String {
        val base = URI(BuildConfig.PRIVATE_API_BASE_URL)
        val candidate = URI(responseUrl)
        require(candidate.scheme == "https" && candidate.host == base.host) {
            "Native response host is not trusted."
        }
        require(
            candidate.path == "/api/live/native/events/$eventId/responses" &&
                candidate.query == null
        ) { "Native response path is not trusted." }
        return candidate.toString()
    }
}

class NativeApiException(val status: Int) : Exception("Private native request failed.")
