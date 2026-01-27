/**
 * Get source info for tracking where users enter the system
 * This info is sent with all API requests for Telegram notifications
 */
export function getSourceInfo() {
  const currentUrl = new URL(window.location.href);
  
  return {
    domain: currentUrl.hostname,
    path: currentUrl.pathname,
    fullUrl: currentUrl.href,
  };
}

/**
 * Add source info to any request body
 */
export function withSourceInfo<T extends object>(body: T): T & { sourceInfo: ReturnType<typeof getSourceInfo> } {
  return {
    ...body,
    sourceInfo: getSourceInfo(),
  };
}
