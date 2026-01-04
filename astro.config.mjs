import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://stylefinds-site.netlify.app',
  output: 'static',
  build: {
    assets: '_assets'
  }
});
