/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites() {
        return [
            {
                source: "/api/users/:path",
                destination: "http://seatingapi/api/users/:path"
            },
            {
                source: "/api/events/:path",
                destination: "http://seatingapi/api/events/:path"
            },
            {
                source: "/api/seats/:path",
                destination: "http://seatingapi/api/seats/:path"
            },
            {
                source: "/api/events/meals/:path",
                destination: "http://seatingapi/api/events/meals/:path"
            }
        ]
    }
};

module.exports = nextConfig;
