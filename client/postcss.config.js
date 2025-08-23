// Updated for Tailwind CSS v4: use the new @tailwindcss/postcss plugin wrapper
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [tailwindcss(), autoprefixer()],
}
