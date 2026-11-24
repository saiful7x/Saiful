package com.saiful.chatai

import android.Manifest
import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
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

    private val accessibilityPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        notifyPermissionState()
    }

    private val callPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
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

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expected = ComponentName(this, OverlayLockAccessibilityService::class.java).flattenToString()
        val enabledServices = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val splitter = TextUtils.SimpleStringSplitter(':')
        splitter.setString(enabledServices)
        while (splitter.hasNext()) {
            val component = splitter.next()
            if (component.equals(expected, ignoreCase = true)) {
                return true
            }
        }
        return false
    }

    private fun hasCallPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun notifyPermissionState() {
        val overlayGranted = Settings.canDrawOverlays(this)
        val accessibilityGranted = isAccessibilityServiceEnabled()
        val callGranted = hasCallPermission()
        webView.post {
            webView.evaluateJavascript(
                "if (window.updateOverlayPermission) { window.updateOverlayPermission($overlayGranted, $accessibilityGranted, $callGranted); }",
                null
            )
        }
    }

    inner class AppBridge {
        @JavascriptInterface
        fun hasOverlayPermission(): Boolean = Settings.canDrawOverlays(this@MainActivity)

        @JavascriptInterface
        fun hasAccessibilityPermission(): Boolean = isAccessibilityServiceEnabled()

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
        fun requestAccessibilityPermission() {
            runOnUiThread {
                val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                accessibilityPermissionLauncher.launch(intent)
            }
        }

        @JavascriptInterface
        fun requestCallPermission() {
            runOnUiThread {
                callPermissionLauncher.launch(Manifest.permission.CALL_PHONE)
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
