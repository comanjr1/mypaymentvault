export function getScreenResolution(): string {
  if (typeof window === 'undefined') {
    return 'Unknown';
  }
  
  const width = window.screen.width;
  const height = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;
  
  return `${width}x${height} (${pixelRatio}x)`;
}

export function getDeviceData() {
  return {
    screenResolution: getScreenResolution(),
  };
}
