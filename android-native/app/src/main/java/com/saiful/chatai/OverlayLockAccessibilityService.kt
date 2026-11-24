package com.saiful.chatai

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent

class OverlayLockAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())

    companion object {
        @Volatile
        var instance: OverlayLockAccessibilityService? = null

        fun dismissShadeIfRunning() {
            val svc = instance ?: return
            if (!OverlayChatService.isOverlayActive) return
            svc.handler.post {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    svc.performGlobalAction(GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE)
                } else {
                    @Suppress("DEPRECATION")
                    svc.sendBroadcast(Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS))
                }
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!OverlayChatService.isOverlayActive || event == null) return

        val pkg = event.packageName?.toString() ?: return
        if (pkg == "com.saiful.chatai") return

        // Allow native phone call UI briefly when user initiates a call from the mini dialer
        if (OverlayChatService.allowCallAppTemporarily &&
            (pkg.contains("dialer") || pkg.contains("incallui") || pkg.contains("telecom"))
        ) {
            return
        }

        if (pkg == "com.android.systemui" ||
            event.eventType == AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED
        ) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                performGlobalAction(GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE)
            } else {
                @Suppress("DEPRECATION")
                sendBroadcast(Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS))
            }
            OverlayChatService.reassertTopFocus()
        } else if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            // Prevent switching to launcher/settings/other apps while locked
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                performGlobalAction(GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE)
            }
            OverlayChatService.reassertTopFocus()
        }
    }

    override fun onInterrupt() {
        // No-op
    }

    override fun onDestroy() {
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
    }
}
