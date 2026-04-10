/**
 * Parses navigator.userAgent to extract browser name + major version and OS name + version.
 * Handles Chromium-based browsers (Brave, Edge, Opera, Vivaldi, Arc, Samsung),
 * Firefox, Safari, and generic Chrome as fallback.
 *
 * @returns {{ browser: string, os: string }}
 */
export const parseDiagnosticsFromNavigator = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  const extractVersion = (pattern) => {
    const match = ua.match(pattern);
    return match?.[1]?.split('.')[0] || '';
  };

  // Browser detection — order matters: specific Chromium forks first, generic Chrome last
  if (typeof navigator.brave !== 'undefined') {
    browser = `Brave v${extractVersion(/Chrome\/([\d.]+)/)}`;
  } else if (ua.includes('Edg/')) {
    browser = `Edge v${extractVersion(/Edg\/([\d.]+)/)}`;
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = `Opera v${extractVersion(/(?:OPR|Opera)\/([\d.]+)/)}`;
  } else if (ua.includes('Vivaldi/')) {
    browser = `Vivaldi v${extractVersion(/Vivaldi\/([\d.]+)/)}`;
  } else if (ua.includes('Arc/')) {
    browser = 'Arc';
  } else if (ua.includes('SamsungBrowser/')) {
    browser = `Samsung Browser v${extractVersion(/SamsungBrowser\/([\d.]+)/)}`;
  } else if (ua.includes('Firefox/')) {
    browser = `Firefox v${extractVersion(/Firefox\/([\d.]+)/)}`;
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = `Safari v${extractVersion(/Version\/([\d.]+)/)}`;
  } else if (ua.includes('Chrome/')) {
    browser = `Chrome v${extractVersion(/Chrome\/([\d.]+)/)}`;
  }

  // OS detection
  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    os = `macOS ${match?.[1]?.replace(/_/g, '.') || ''}`;
  } else if (ua.includes('Windows NT')) {
    const match = ua.match(/Windows NT ([\d.]+)/);
    const versions = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    os = `Windows ${versions[match?.[1]] || match?.[1] || ''}`;
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/);
    os = `Android ${match?.[1] || ''}`;
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS ([\d_]+)/);
    os = `iOS ${match?.[1]?.replace(/_/g, '.') || ''}`;
  }

  return { browser: browser.trim(), os: os.trim() };
};
