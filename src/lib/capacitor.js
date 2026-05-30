export const isNative = () => {
  try {
    return !!(window.Capacitor && window.Capacitor.isNative);
  } catch {
    return false;
  }
};

export function initCapacitor() {
  try {
    if (!window.Capacitor || !window.Capacitor.isNative) return;

    import('@capacitor/status-bar').then(({ StatusBar }) => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    }).catch(() => {});

    import('@capacitor/app').then(({ App }) => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack && App.exitApp) App.exitApp();
        else window.history.back();
      });
    }).catch(() => {});

    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide().catch(() => {});
    }).catch(() => {});
  } catch {}
}
