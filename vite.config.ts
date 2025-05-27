import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Solución para los plugins de PostCSS
const postcssPlugins = {
  tailwindcss: require('tailwindcss'),
  autoprefixer: require('autoprefixer')
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: '/monitor-de-procesos-judiciales/',
    css: {
      postcss: {
        plugins: [
          postcssPlugins.tailwindcss,
          postcssPlugins.autoprefixer
        ]
      }
    },
    define: {
      'process.env': {
        API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});