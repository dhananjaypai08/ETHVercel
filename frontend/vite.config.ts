import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@privy-io/react-auth',
        '@web3-storage/w3up-client',
        '@apollo/client',
        'ethers',
        'framer-motion',
        'recharts',
        'lucide-react',
        '@zerodev/sdk',
        '@zerodev/ecdsa-validator'
      ]
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@web3-storage/w3up-client']
  }
})