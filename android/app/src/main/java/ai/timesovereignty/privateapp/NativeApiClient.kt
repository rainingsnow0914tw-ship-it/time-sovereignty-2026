package ai.timesovereignty.privateapp

import android.os.Build
import android.os.Handler
import android.os.Looper
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

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
                val response = postJson("/api/live/native/pair", body, null)
                NativePairingSession(
                    deviceId = response.getString("deviceId"),
                    credential = response.getString("credential"),
                    expiresAt = response.getString("expiresAt")
                )
            }
            main.post { callback(result) }
        }
    }

    private fun postJson(
        path: String,
        body: JSONObject,
        session: NativePairingSession?
    ): JSONObject {
        val connection = (URL(BuildConfig.PRIVATE_API_BASE_URL + path)
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
}

class NativeApiException(val status: Int) : Exception("Private native request failed.")
