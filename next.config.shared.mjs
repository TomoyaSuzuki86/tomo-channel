const imageRemotePatterns = [
  {
    protocol: "https",
    hostname: "images.unsplash.com"
  }
];

export function createNextConfig({ appHosting = false } = {}) {
  return {
    ...(appHosting ? {} : { output: "export" }),
    images: {
      unoptimized: true,
      remotePatterns: imageRemotePatterns
    }
  };
}
