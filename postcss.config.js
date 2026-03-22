// postcss.config.js (ES6 version)
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindPostCSS from '@tailwindcss/postcss';

export default {
  plugins: [
  tailwindPostCSS(), // Use the new @tailwindcss/postcss plugin
  autoprefixer(),
  ],
};