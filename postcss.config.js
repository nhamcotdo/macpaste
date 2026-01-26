export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // Autoprefixer is likely still needed or included in tailwind/postcss? Tailwind 4 includes it usually, but keeping it doesn't hurt often. Verify? 
        // Tailwind 4 PostCSS plugin includes autoprefixer. Removing it might be safer if using @tailwindcss/postcss
    },
}
