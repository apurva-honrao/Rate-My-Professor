/** @type {import('next').NextConfig} */
const nextConfig = {
    // Override the default webpack configuration
    experimental: {
        serverComponentsExternalPackages: ['sharp', 'onnxruntime-node', 'puppeteer-core', '@sparticuz/chromium'],
    },
};

export default nextConfig;
