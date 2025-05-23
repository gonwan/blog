### Blog
My personal blog based on [Hexo](https://github.com/hexojs/hexo). No WordPress, No PHP.

- Site hosting: Cloudflare Pages
- Image hosting: Cloudflare R2
- All source files including markdown and images are stored in Github, in one place.
- All text-base artifacts and site images are built and deployed by Github Action. Post images are uploaded to Cloudflare R2 manually. Links of these images are replaced to the CDN-hosed one after building. Sparse checkout is used to accelerate the build.
- [Astro](https://github.com/withastro/astro) was also considered, but its themes work as templates, not plugins. I do not want to merge theme updates manually.
