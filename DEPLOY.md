# Tanisha Srinivasan — Portfolio

This folder is ready to publish with GitHub Pages.

## What is public vs local?

`http://127.0.0.1:4000` is only a local preview. It works only on the computer
running `bundle exec jekyll serve`.

Once this repository is deployed with GitHub Pages, the site is hosted online
and visitors do not need Ruby, Jekyll, your laptop, or access to your files.

## Recommended setup

1. Create a new GitHub repository.
2. A clean repository name is `portfolio` or `tanisha-srinivasan`.
3. Upload/push the CONTENTS of this folder to the repository (not the zip itself).
4. Make sure the default branch is named `main`.
5. In the repository, open Settings → Pages.
6. Under Build and deployment / Source, select **GitHub Actions**.
7. Push to `main`. The included `.github/workflows/pages.yml` workflow will build
   and publish the Jekyll site.
8. When the workflow finishes, GitHub Pages will show the public URL.

If the repository is named `portfolio`, the default link will typically look like:

    https://YOUR-GITHUB-USERNAME.github.io/portfolio/

If you instead create a repository named exactly:

    YOUR-GITHUB-USERNAME.github.io

then it becomes your GitHub user site and the URL is:

    https://YOUR-GITHUB-USERNAME.github.io/

## Custom domain later

You can later connect a domain such as `tanishasrinivasan.com` through
Settings → Pages without rebuilding the portfolio from scratch.
