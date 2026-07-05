/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.css",
    ],
    theme: {
        extend: {
            colors: {
                mbg: {
                    50: '#f0f9ff',  // Biru langit sangat pudar (Background luar)
                    100: '#e0f2fe', // Biru langit pudar (Border)
                    500: '#0ea5e9', // Biru langit utama (Tombol & Aksen)
                    600: '#0284c7', // Biru hover tombol
                    800: '#075985', // Navy medium (Label teks)
                    900: '#0c4a6e', // Navy gelap (Teks utama)
                },
            },
        },
    },
    plugins: [],
};