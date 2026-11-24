import { useState } from 'react';
import PermissionGate from './components/PermissionGate';
import ControlDashboard from './components/ControlDashboard';
import OverlayChat from './components/OverlayChat';
import OfflineIndicator from './components/OfflineIndicator';
import { ServiceStatus } from './types';

const PERMISSION_STORAGE_KEY = 'saiful_overlay_permission_granted';

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PERMISSION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('idle');

  const handleGrantPermission = () => {
    try {
      localStorage.setItem(PERMISSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage write errors in restricted environments
    }
    setPermissionGranted(true);
    setServiceStatus('idle');
  };

  const handleRevokePermission = () => {
    try {
      localStorage.removeItem(PERMISSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setPermissionGranted(false);
    setServiceStatus('idle');
  };

  const handleStartOverlay = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({
          navigationUI: 'hide',
        } as FullscreenOptions);
      }
    } catch {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Browser/iframe policies may restrict Fullscreen API; full-viewport fixed overlay still activates
      }
    }
    try {
      const nav = navigator as Navigator & {
        keyboard?: { lock?: (keys?: string[]) => Promise<void> };
      };
      if (nav.keyboard?.lock) {
        await nav.keyboard.lock([
          'Escape',
          'Tab',
          'MetaLeft',
          'MetaRight',
          'AltLeft',
          'AltRight',
          'F11',
        ]);
      }
    } catch {
      // Keyboard Lock API may be unavailable on mobile/iframe
    }
    setServiceStatus('running');
  };

  const handleUnlockSuccess = () => {
    setServiceStatus('stopped');
  };

  return (
    <>
      {!permissionGranted ? (
        <PermissionGate onGrant={handleGrantPermission} />
      ) : serviceStatus === 'running' ? (
        <OverlayChat onUnlockSuccess={handleUnlockSuccess} />
      ) : (
        <ControlDashboard
          status={serviceStatus}
          onStartOverlay={handleStartOverlay}
          onRevokePermission={handleRevokePermission}
        />
      )}
      <OfflineIndicator />
    </>
  );
}
