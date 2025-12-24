/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // 🌿 Màu chủ đạo - tạo cảm giác tin cậy, tươi mát
        primary: "#0D9488",       // teal-600
        primaryDark: "#0F766E",   // teal-700 (hover, nhấn mạnh)
        primaryLight: "#14B8A6",  // teal-500 (viền, icon nhẹ)
        secondary: "#E0F7F5",
        
        // 🌤 Màu điểm nhấn - dùng cho nút hành động, CTA
        accent: "#FBBF24",        // vàng 400 - ấm, thân thiện
        accentHover: "#F59E0B",   // vàng 500 - hover CTA
        
        // 🎨 Nền & text
        background: "#F8FAFC",    // gray-50
        cardBg: "#FFFFFF",        // trắng thuần cho card
        textDark: "#334155",      // slate-700
        textGray: "#64748B",      // slate-500
        borderLight: "#E2E8F0",   // gray-200
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
