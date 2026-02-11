export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("zoan_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("zoan_device_id", deviceId);
  }
  return deviceId;
}

export function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  // Simple fingerprint based on browser info
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
  ].join("|");
  return btoa(fingerprint).substring(0, 32);
}
