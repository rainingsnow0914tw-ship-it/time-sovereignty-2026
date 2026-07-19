package ai.timesovereignty.privateapp

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(buildContent())
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 100)
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
            addView(TextView(this@MainActivity).apply {
                text = "目前階段：Android 外殼已就位；受保護的 FCM 配對與真實回寫正在施工。"
                textSize = 14f
                setTextColor(Color.rgb(95, 106, 100))
                setPadding(0, dp(24), 0, 0)
            })
        }
    }
}
