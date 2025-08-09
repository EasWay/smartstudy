// Deployment configuration for various platforms
module.exports = {
    // Netlify deployment
    netlify: {
        build: {
            command: "npm run build:web",
            publish: "dist"
        },
        redirects: [
            {
                from: "/*",
                to: "/index.html",
                status: 200
            }
        ],
        headers: [
            {
                for: "/*",
                values: {
                    "X-Frame-Options": "DENY",
                    "X-Content-Type-Options": "nosniff",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                }
            },
            {
                for: "/static/*",
                values: {
                    "Cache-Control": "public, max-age=31536000, immutable"
                }
            }
        ]
    },

    // Vercel deployment
    vercel: {
        buildCommand: "npm run build:web",
        outputDirectory: "dist",
        routes: [
            {
                src: "/static/(.*)",
                headers: {
                    "Cache-Control": "public, max-age=31536000, immutable"
                }
            },
            {
                src: "/(.*)",
                dest: "/index.html"
            }
        ]
    },

    // GitHub Pages deployment
    githubPages: {
        build: "npm run build:web",
        deploy: "gh-pages -d dist"
    },

    // Firebase Hosting
    firebase: {
        hosting: {
            public: "dist",
            ignore: [
                "firebase.json",
                "**/.*",
                "**/node_modules/**"
            ],
            rewrites: [
                {
                    source: "**",
                    destination: "/index.html"
                }
            ],
            headers: [
                {
                    source: "/static/**",
                    headers: [
                        {
                            key: "Cache-Control",
                            value: "public, max-age=31536000, immutable"
                        }
                    ]
                }
            ]
        }
    }
};