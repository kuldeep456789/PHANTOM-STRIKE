/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  turbopack: isDev
    ? {
        rules: {
          '*.css': {
            loaders: ['@tailwindcss/turbopack'],
            as: '*.css',
          },
        },
      }
    : {},
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
