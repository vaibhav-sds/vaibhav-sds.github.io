# Vaibhav Agarwal — personal website

The approved black-and-white website, with About, Research, CV, and Contact. Projects are included in Research; Blog and Interests have been removed. Both light and dark themes are included, and the portrait stays in color.

This is a static website. No installation, build step, or server-side code is needed.

## Open and edit

Open `index.html` in your browser to view the website locally.

- `index.html`: About page.
- `research.html`: research and project cards.
- `project-*.html`: project detail pages.
- `cv.html` and `cv.pdf`: CV page and downloadable PDF.
- `contact.html`: contact page.
- `style.css`: shared layout and colors.
- `script.js`: theme toggle and other interactions.
- `photo.jpg` and `images/`: images.

To replace the CV PDF later, overwrite `cv.pdf` with the same filename.

## Publish on GitHub Pages

Planned new repository: `vaibhav-sds/vaibhav-sds.github.io`. Repository creation and publishing are handled separately; this archive does not confirm either action has finished.

1. Extract the ZIP and put its contents at the repository root. `index.html`, `style.css`, `script.js`, and `.nojekyll` should be at the top level; keep the `images` folder intact.
2. Commit the files to the `main` branch.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, and click **Save**.
4. Use the **Visit site** link shown by GitHub Pages when deployment finishes. The expected address for this repository is `https://vaibhav-sds.github.io/`.

Later commits to the selected branch update the published website. The existing repository does not need to be changed.

Official setup instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
