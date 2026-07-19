package ai.timesovereignty.privateapp

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class IncomingCheckInActivity : Activity() {
    private lateinit var eventId: String
    private lateinit var ringer: BoundedRinger

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        eventId = intent.getStringExtra(EXTRA_EVENT_ID) ?: return finish()
        ringer = BoundedRinger(this)
        setContentView(buildContent())
        ringer.start()
    }

    private fun buildContent(): LinearLayout {
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "澄來找妳了"
        val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "現在真實情況是什麼？"
        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), dp(92), dp(28), dp(36))
            setBackgroundColor(Color.rgb(23, 63, 53))

            addView(TextView(this@IncomingCheckInActivity).apply {
                text = "INCOMING CHECK-IN"
                textSize = 14f
                setTextColor(Color.rgb(192, 232, 216))
            })
            addView(TextView(this@IncomingCheckInActivity).apply {
                text = title
                textSize = 32f
                setTextColor(Color.WHITE)
                setPadding(0, dp(14), 0, dp(20))
            })
            addView(TextView(this@IncomingCheckInActivity).apply {
                text = message
                textSize = 20f
                setTextColor(Color.rgb(244, 241, 231))
                setPadding(0, 0, 0, dp(30))
            })

            addResponseButton("我完成了", "complete")
            addResponseButton("延後 10 分鐘", "reschedule")
            addResponseButton("把行動縮小", "downgrade")
            addResponseButton("今天需要休息", "mercy")
        }
    }

    private fun LinearLayout.addResponseButton(label: String, responseType: String) {
        addView(Button(this@IncomingCheckInActivity).apply {
            text = label
            isAllCaps = false
            setOnClickListener { finishWith(responseType) }
        })
    }

    private fun finishWith(responseType: String) {
        ringer.stop()
        CatchNotifications.cancel(this, eventId)
        // The protected response endpoint is the next adapter. Until then the
        // local preview exits without pretending that anything was persisted.
        setResult(RESULT_OK, Intent().putExtra("response_type", responseType))
        finish()
    }

    override fun onStop() {
        ringer.stop()
        super.onStop()
    }

    override fun onDestroy() {
        ringer.stop()
        super.onDestroy()
    }

    companion object {
        private const val EXTRA_EVENT_ID = "event_id"
        private const val EXTRA_LEVEL = "level"
        private const val EXTRA_TITLE = "title"
        private const val EXTRA_MESSAGE = "message"
        private const val EXTRA_RESPONSE_URL = "response_url"
        private const val EXTRA_EXPIRES_AT = "expires_at"

        fun intent(context: Context, payload: CatchPayload): Intent =
            Intent(context, IncomingCheckInActivity::class.java).apply {
                putExtra(EXTRA_EVENT_ID, payload.eventId)
                putExtra(EXTRA_LEVEL, payload.level)
                putExtra(EXTRA_TITLE, payload.title)
                putExtra(EXTRA_MESSAGE, payload.message)
                putExtra(EXTRA_RESPONSE_URL, payload.responseUrl)
                putExtra(EXTRA_EXPIRES_AT, payload.expiresAt)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
    }
}
