import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // vite.config.j
  base: '/proxt/', // Replace 'broke' with your repo name
  build: {
    outDir: 'dist', // Ensure the build output is to the 'dist' folder
  },


  plugins: [react()],
})
