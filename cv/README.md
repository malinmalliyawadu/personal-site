# McDowell CV Implementation

This directory contains a LaTeX implementation of the McDowell CV template.

## Requirements

- Docker - used to compile the LaTeX document without requiring LaTeX installed locally

## How to Generate the CV

You can generate the CV using the pnpm script:

```bash
pnpm run generate-cv
```

This script will:

1. Create a directory in public/cv if it doesn't exist
2. Compile the LaTeX document using Docker
3. Copy the resulting PDF to the public/cv directory

## How to Edit the CV

1. Modify the `Malin_CV.tex` file
2. Run the generation script
3. The updated CV will be available at `/cv/Malin_CV.pdf` on your site

## About the McDowell CV Template

The McDowell CV template is based on a design by Gayle L. McDowell. The original template is available at https://github.com/dnl-blkv/mcdowell-cv.

## Customizing the Template

- **Change Font**: Edit the class file `mcdowellcv.cls` and update the `\mainfontface` setting
- **Add Sections**: Follow the pattern in `Malin_CV.tex` to add new sections with the `cvsection` environment
- **Add Entries**: Use the `cvsubsection` environment to add new entries within sections

## Troubleshooting

If you encounter errors:

1. Make sure Docker is installed and running
2. Check the LaTeX document for syntax errors
3. Try compiling manually: `cd cv && docker run --rm -v "$(pwd):/data" -w /data texlive/texlive lualatex Malin_CV.tex`
