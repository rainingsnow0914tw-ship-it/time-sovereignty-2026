package ai.timesovereignty.privateapp

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class TimeSovereigntyMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // Registration is wired only after the protected device endpoint exists.
        // Never print or persist the raw FCM token in logs.
        Log.i(TAG, "A new private device token is ready for protected registration.")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val payload = CatchPayload.from(message.data)
        if (payload == null) {
            Log.w(TAG, "Rejected an invalid Time Sovereignty push payload.")
            return
        }
        CatchNotifications.show(this, payload)
    }

    companion object {
        private const val TAG = "TimeSovereigntyPush"
    }
}
