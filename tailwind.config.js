/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF', // Muito espaço em branco
        surface: '#F8F9FA', // Cinza muito claro para cards
        primary: '#000000', // Texto principal e botões primários
        secondary: '#6B7280', // Texto secundário (Cinza)
        accent: '#2563EB', // Azul para destaques sutis
        success: '#10B981', // Verde para OK/Pago
        danger: '#EF4444', // Vermelho para Erro/Vencido
      },
    },
  },
  plugins: [],
}
