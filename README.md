# excalidraw_export

This is a simple Node package to export Excalidraw drawings to SVG, and optionally PDF (requires `rsvg-convert`).

## Install

    npm install --global excalidraw_export

By default `node-canvas` dependency downloads pre-built binaries, but these
might not exist for your platform. In that case you need to install these
[dependencies](https://github.com/Automattic/node-canvas?tab=readme-ov-file#compiling)
separately.

## Use

Simplest is as follows.

    excalidraw_export foo.excalidraw bar.excalidraw

This will create two files: `foo.excalidraw.svg` and `bar.excalidraw.svg`.

If you have `rsvg-convert` installed, and you *additionally* want PDF files use

    excalidraw_export --pdf foo.excalidraw bar.excalidraw

This will also generate `foo.excalidraw.pdf` and `bar.excalidraw.pdf`.

## Fonts

Unfortunately the font situation is a bit of a mess. Excalidraw uses two fonts - Virgil and Cascadia. By default it references them using CSS like this:

    <defs>
      <style>
        @font-face {
          font-family: "Virgil";
          src: url("https://excalidraw.com/Virgil.woff2");
        }
        @font-face {
          font-family: "Cascadia";
          src: url("https://excalidraw.com/Cascadia.woff2");
        }
      </style>
    </defs>
    <text font-family="Virgil, Segoe UI Emoji" ...

This means the file is small, but now you need network access to use the fonts! Not great. So this tool provides a `--embed-fonts` option which will embed the fonts in the SVG (even if they aren't used). This increases the file size a bit (so you probably don't want to use it on the web) but it's good for e.g. HTML presentations.

Unfortunately there's a big downside of `<style> @font-face`. No SVG renderers except web browsers support CSS fonts in SVG. ImageMagick, `rsvg-convert`, Inkscape, etc. will all ignore it.

Therefore if you want to convert to PDF while retaining fonts you have to install the actual Virgil and Cascadia fonts on your system. Then `rsvg-convert` works fine.

However there is one minor snag - the actual fonts are called `Virgil GS` and `Cascadia Code`. So this tool has another option `--rename-fonts` which will change the `font-family`s like so:

    <text font-family="Virgil SG, Segoe UI Emoji" ...

This lets it find the system font.

## Troubleshooting

If you get an error like this:

```
npm ERR! ../src/Image.h:18:10: fatal error: 'gif_lib.h' file not found
npm ERR! #include <gif_lib.h>
npm ERR!          ^~~~~~~~~~~
npm ERR! 1 warning and 1 error generated.
```

See [this thread](https://github.com/Automattic/node-canvas/issues/788) for suggestions.
