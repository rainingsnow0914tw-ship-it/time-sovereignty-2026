package ai.timesovereignty.privateapp

import android.content.Context

object PushDedupeStore {
    private const val PREFS = "private_push_receipts"
    private const val KEYS = "handled_idempotency_keys"
    private const val MAX_KEYS = 128

    fun claim(context: Context, idempotencyKey: String): Boolean {
        val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val current = preferences.getStringSet(KEYS, emptySet()).orEmpty().toMutableSet()
        if (!current.add(idempotencyKey)) return false
        val bounded = if (current.size > MAX_KEYS) {
            current.sorted().takeLast(MAX_KEYS / 2).toSet()
        } else {
            current
        }
        preferences.edit().putStringSet(KEYS, bounded).apply()
        return true
    }
}
