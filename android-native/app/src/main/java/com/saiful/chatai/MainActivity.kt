package com.saiful.chatai

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        notifyPermissionState()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    notifyPermissionState()
                }
            }
            addJavascriptInterface(AppBridge(), "AndroidApp")
        }

        setContentView(webView)
        webView.loadUrl("file:///android_asset/main_ui.html")
    }

    override fun onResume() {
        super.onResume()
        notifyPermissionState()
    }

    private fun notifyPermissionState() {
        val granted = Settings.canDrawOverlays(this)
        webView.post {
            webView.evaluateJavascript(
                "if (window.updateOverlayPermission) { window.updateOverlayPermission($granted); }",
                null
            )
        }
    }

    inner class AppBridge {
        @JavascriptInterface
        fun hasOverlayPermission(): Boolean {
            return Settings.canDrawOverlays(this@MainActivity)
        }

        @JavascriptInterface
        fun requestOverlayPermission() {
            runOnUiThread {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                overlayPermissionLauncher.launch(intent)
            }
        }

        @JavascriptInterface
        fun startChattingOverlay(): Boolean {
            if (!Settings.canDrawOverlays(this@MainActivity)) {
                requestOverlayPermission()
                return false
            }
            runOnUiThread {
                val serviceIntent = Intent(this@MainActivity, OverlayChatService::class.java)
                ContextCompat.startForegroundService(this@MainActivity, serviceIntent)
                moveTaskToBack(true)
            }
            return true
        }
    }
}
