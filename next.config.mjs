/** @type {import('next').NextConfig} */
const nextConfig = {
    // Esto es para que no se queje si algún día queremos mostrar fotos externas
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;