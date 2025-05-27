import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    
    // Configuración esencial para GitHub Pages
    base: '/monitor-de-procesos-judiciales/',
    
    // Configuración de build
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode !== 'production'
    },
    
    // Resolución de alias 
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    
    // Variables de entorno 
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    
    // Configuración opcional para CSS/Tailwind
    css: {
      postcss: {
        plugins: [require('tailwindcss'), require('autoprefixer')]
      }
    }
  };
});