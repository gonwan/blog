### Blog
My personal blog based on Hexo.

- Site hosting: Cloudflare Pages
- Image hosting: Cloudflare R2
- All source files including markdown and images are stored in Github, in one place.
- All text-base artifacts and site images are built and deployed by Github Action. Post images are uploaded to Cloudflare R2 manually. Links of these images are replaced to the CDN-hosed one after building. Sparse checkout is used to accelerate the build.
