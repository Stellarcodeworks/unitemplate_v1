/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "#0a0a0a",
                foreground: "#ededed",
                card: "#1a1a1a",
                border: "#2a2a2a",
                primary: "#3b82f6",
                "primary-foreground": "#ffffff",
                muted: "#a1a1aa",
                destructive: "#ef4444",
            },
        },
    },
    plugins: [],
};
