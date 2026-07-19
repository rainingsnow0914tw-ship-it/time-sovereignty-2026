package ai.timesovereignty.privateapp

import android.Manifest
import android.app.Activity
import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.pm.PackageManager
import android.graphics.Color
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : Activity() {
    private lateinit var pushStatus: TextView
    private var pendingPairingTicket: String? = null
    private var fcmToken: String? = null
    private lateinit var fullScreenStatus: TextView
    private lateinit var fullScreenAccessButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(buildContent())
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 100)
        }
        preparePrivatePushChannel()
        acceptPairingIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        if (::fullScreenStatus.isInitialized) refreshFullScreenIntentAccess()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        acceptPairingIntent(intent)
    }

    private fun preparePrivatePushChannel() {
        pushStatus.text = "正在建立私人推播通道…"
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful || task.result.isNullOrBlank()) {
                pushStatus.text = "私人推播通道尚未就緒；稍後會自動重試。"
                return@addOnCompleteListener
            }
            DebugFcmTokenStore.save(this, task.result)
            fcmToken = task.result
            pushStatus.text = if (NativeCredentialStore.load(this) != null) {
                "私人推播通道已配對 · 憑證只保存在這支手機"
            } else {
                "私人推播通道已就緒 · 從 PWA 開始一次性配對"
            }
            tryPairing()
        }
    }

    private fun acceptPairingIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "timesovereignty-private" || data.host != "pair") return
        val ticket = data.getQueryParameter("ticket")?.trim().orEmpty()
        if (ticket.length !in 32..500) {
            pushStatus.text = "配對票無效，請回到 PWA 重新開始。"
            return
        }
        pendingPairingTicket = ticket
        pushStatus.text = "收到一次性配對票，正在建立受保護連線…"
        intent.data = null
        tryPairing()
    }

    private fun tryPairing() {
        val ticket = pendingPairingTicket ?: return
        val token = fcmToken ?: return
        pendingPairingTicket = null
        NativeApiClient.pair(ticket, token) { result ->
            result.onSuccess { session ->
                NativeCredentialStore.save(this, session)
                pushStatus.text = "配對完成 · 真實世界跟進通道已受保護地連線"
            }.onFailure {
                pushStatus.text = "配對未完成；票可能已使用或過期，請從 PWA 重試。"
            }
        }
    }

    private fun refreshFullScreenIntentAccess() {
        val manager = getSystemService(NotificationManager::class.java)
        val systemAllows = Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE ||
            manager.canUseFullScreenIntent()
        when (FullScreenIntentPolicy.evaluate(Build.VERSION.SDK_INT, systemAllows)) {
            FullScreenIntentAccessState.READY -> {
                fullScreenStatus.text = "全螢幕來電已允許 · 高優先跟進可在鎖屏顯示"
                fullScreenStatus.setTextColor(Color.rgb(35, 111, 78))
                fullScreenAccessButton.visibility = View.GONE
            }
            FullScreenIntentAccessState.NEEDS_USER_APPROVAL -> {
                fullScreenStatus.text =
                    "還差一步：Android 尚未允許全螢幕來電。一般通知會到，但鎖屏不會自動打開。"
                fullScreenStatus.setTextColor(Color.rgb(151, 72, 48))
                fullScreenAccessButton.visibility = View.VISIBLE
            }
        }
    }

    private fun openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return
        try {
            startActivity(
                Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:$packageName")
                )
            )
        } catch (_: ActivityNotFoundException) {
            fullScreenStatus.text = "找不到全螢幕來電設定；請從系統設定開啟 Time Sovereignty 的特殊存取權。"
        }
    }

    private fun buildContent(): LinearLayout {
        val density = resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), dp(72), dp(28), dp(28))
            setBackgroundColor(Color.rgb(245, 241, 232))

            addView(TextView(this@MainActivity).apply {
                text = "Time Sovereignty"
                textSize = 30f
                setTextColor(Color.rgb(23, 63, 53))
            })
            addView(TextView(this@MainActivity).apply {
                text = "私人 V2 · 真實世界跟進通道"
                textSize = 16f
                setTextColor(Color.rgb(77, 95, 87))
                setPadding(0, dp(8), 0, dp(28))
            })
            addView(TextView(this@MainActivity).apply {
                text = "這支裝置只會在妳明確同意、非安靜時段，而且承諾仍有效時收到升級跟進。生病、暫停或撤銷後必須停止。"
                textSize = 17f
                setTextColor(Color.rgb(36, 53, 46))
            })
            fullScreenStatus = TextView(this@MainActivity).apply {
                textSize = 14f
                setPadding(0, dp(22), 0, dp(8))
            }
            addView(fullScreenStatus)
            fullScreenAccessButton = Button(this@MainActivity).apply {
                text = "允許全螢幕來電"
                isAllCaps = false
                setOnClickListener { openFullScreenIntentSettings() }
                visibility = View.GONE
            }
            addView(fullScreenAccessButton)
            addView(Button(this@MainActivity).apply {
                text = "本機預覽假電話（不連雲端）"
                isAllCaps = false
                setOnClickListener {
                    startActivity(
                        IncomingCheckInActivity.intent(
                            this@MainActivity,
                            CatchPayload(
                                eventId = "local-preview",
                                level = 4,
                                title = "澄來找妳了",
                                message = "不是催妳交作業。我想知道：原本的計畫還適合現在的真實情況嗎？",
                                responseUrl = null,
                                expiresAt = null
                            )
                        )
                    )
                }
                setPadding(dp(8), dp(14), dp(8), dp(14))
            })
            pushStatus = TextView(this@MainActivity).apply {
                text = "目前階段：Android 外殼已就位；受保護的 FCM 配對與真實回寫正在施工。"
                textSize = 14f
                setTextColor(Color.rgb(95, 106, 100))
                setPadding(0, dp(24), 0, 0)
            }
            addView(pushStatus)
        }
    }
}
