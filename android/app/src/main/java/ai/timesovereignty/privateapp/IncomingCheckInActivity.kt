package ai.timesovereignty.privateapp

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.util.UUID

class IncomingCheckInActivity : Activity() {
    private lateinit var eventId: String
    private lateinit var statusText: TextView
    private val responseButtons = mutableListOf<Button>()
    private var pendingResponseId: String? = null
    private var pendingResponseType: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        eventId = intent.getStringExtra(EXTRA_EVENT_ID) ?: return finish()
        CatchAttentionSignal.stopPrompt()
        setContentView(buildContent())
        if (intent.getIntExtra(EXTRA_LEVEL, 4) == 4) {
            CatchAttentionSignal.playCall(this)
        }
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

            statusText = TextView(this@IncomingCheckInActivity).apply {
                text = "請選擇最符合現在真實情況的一項。"
                textSize = 14f
                setTextColor(Color.rgb(192, 232, 216))
                setPadding(0, 0, 0, dp(14))
            }
            addView(statusText)
            addResponseButton("我完成了", "complete")
            addResponseButton("延後 10 分鐘", "reschedule")
            addResponseButton("把行動縮小", "downgrade")
            addResponseButton("今天需要休息", "mercy")
        }
    }

    private fun LinearLayout.addResponseButton(label: String, responseType: String) {
        val button = Button(this@IncomingCheckInActivity).apply {
            text = label
            isAllCaps = false
            setOnClickListener { submitResponse(responseType) }
        }
        responseButtons += button
        addView(button)
    }

    private fun submitResponse(responseType: String) {
        CatchAttentionSignal.stopAll()
        CatchNotifications.cancel(this, eventId)
        val responseUrl = intent.getStringExtra(EXTRA_RESPONSE_URL)
        val session = NativeCredentialStore.load(this)
        if (responseUrl.isNullOrBlank() || session == null || eventId == "local-preview") {
            setResult(RESULT_OK, Intent().putExtra("response_type", responseType))
            finish()
            return
        }
        pendingResponseType = responseType
        pendingResponseId = pendingResponseId ?: UUID.randomUUID().toString()
        responseButtons.forEach { it.isEnabled = false }
        statusText.text = "已停止鈴聲。澄正在用 GPT-5.6 理解現在的真實情況…"
        NativeApiClient.respond(
            responseUrl = responseUrl,
            eventId = eventId,
            responseType = responseType,
            responseId = pendingResponseId!!,
            session = session
        ) { result ->
            result.onSuccess { decision -> showDecision(decision) }
                .onFailure {
                    statusText.text = "這次回應尚未安全保存。請重試同一筆回應；系統不會重複處理。"
                    responseButtons.forEach { it.isEnabled = false }
                    responseButtons.firstOrNull()?.apply {
                        text = "重試安全送出"
                        isEnabled = true
                        setOnClickListener { submitResponse(pendingResponseType!!) }
                    }
                }
        }
    }

    private fun showDecision(decision: NativeDecision) {
        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), dp(72), dp(28), dp(36))
            setBackgroundColor(Color.rgb(245, 241, 232))
            addView(TextView(this@IncomingCheckInActivity).apply {
                text = "GPT-5.6 已理解"
                textSize = 14f
                setTextColor(Color.rgb(75, 111, 95))
            })
            addView(TextView(this@IncomingCheckInActivity).apply {
                text = decision.userMessage
                textSize = 21f
                setTextColor(Color.rgb(23, 63, 53))
                setPadding(0, dp(16), 0, dp(20))
            })
            addView(TextView(this@IncomingCheckInActivity).apply {
                text = "調整後的承諾\n${decision.adaptedCommitment}"
                textSize = 17f
                setTextColor(Color.rgb(36, 53, 46))
                setPadding(0, 0, 0, dp(20))
            })
            addView(Button(this@IncomingCheckInActivity).apply {
                text = if (decision.requiresConfirmation) "回到 PWA 確認" else "完成"
                isAllCaps = false
                setOnClickListener {
                    if (decision.requiresConfirmation) {
                        openPwaForConfirmation(this)
                    } else {
                        finish()
                    }
                }
            })
        })
    }

    private fun openPwaForConfirmation(button: Button) {
        val returnUrl = PrivatePwaReturnUrl.build(BuildConfig.PRIVATE_PWA_BASE_URL)
        if (returnUrl == null) {
            button.text = "無法開啟 PWA；請從桌面開啟 Time Sovereignty"
            button.isEnabled = false
            return
        }

        try {
            val returnIntent = Intent(Intent.ACTION_VIEW, Uri.parse(returnUrl)).apply {
                addCategory(Intent.CATEGORY_BROWSABLE)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            val handlerPackages = packageManager
                .queryIntentActivities(returnIntent, 0)
                .map { it.activityInfo.packageName }
            PrivatePwaHandlerSelector.choose(handlerPackages)?.let(returnIntent::setPackage)
            startActivity(returnIntent)
            finish()
        } catch (_: ActivityNotFoundException) {
            button.text = "找不到瀏覽器；請從桌面開啟 Time Sovereignty"
            button.isEnabled = false
        }
    }

    override fun onStop() {
        CatchAttentionSignal.stopAll()
        super.onStop()
    }

    override fun onDestroy() {
        CatchAttentionSignal.stopAll()
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
