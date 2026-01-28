/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    pink: '#ff006e',
                    cyan: '#00f5ff',
                    purple: '#b537f2',
                    lime: '#39ff14',
                    orange: '#ff6600',
                },
            },
            textShadow: {
                'neon-pink': '0 0 10px #ff006e, 0 0 20px #ff006e',
                'neon-cyan': '0 0 10px #00f5ff, 0 0 20px #00f5ff',
                'neon-purple': '0 0 10px #b537f2, 0 0 20px #b537f2',
            },
            boxShadow: {
                'neon-pink': '0 0 20px #ff006e, 0 0 40px #ff006e',
                'neon-cyan': '0 0 20px #00f5ff, 0 0 40px #00f5ff',
                'neon-purple': '0 0 20px #b537f2, 0 0 40px #b537f2',
            },
        },
    },
    plugins: [],
}
