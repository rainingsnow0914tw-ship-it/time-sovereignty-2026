package ai.timesovereignty.privateapp

import android.content.Context

object DebugFcmTokenStore {
    private const val FILE_NAME = "debug-fcm-token"

    fun save(context: Context, token: String) {
        if (!BuildConfig.DEBUG || token.isBlank()) return
        context.openFileOutput(FILE_NAME, Context.MODE_PRIVATE).use { output ->
            output.write(token.toByteArray(Charsets.UTF_8))
        }
    }

    fun clear(context: Context) {
        context.deleteFile(FILE_NAME)
    }
}
