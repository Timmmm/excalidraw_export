#!/usr/bin/env node

import { JSDOM } from "jsdom";
import * as child_process from "child_process";
import * as fs from "fs";
import * as process from "process";

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

// Filled in by compile.js.
const EXCALIDRAW_UTILS_SOURCE = "";
const CASCADIA_BASE64 = "";
const VIRGIL_BASE64 = "";
const PATH_2D_POLYFILL = "";

function excalidrawToSvg(diagram: string): Promise<string> {

  // Parse to JSON and back for safety! Very important.
  const excalidrawDiagram = JSON.parse(diagram);

  // Script to run.
  const exportScript = `
    <body>
      <script>
        // mock CanvasRenderingContext2D (which currently blows up in the canvas-5-polyfill)
        class CanvasRenderingContext2D {}

        // load canvas-5-polyfill
        ${PATH_2D_POLYFILL}

        // load excalidraw-utils
        ${EXCALIDRAW_UTILS_SOURCE}

        async function renderSvg() {
          return (await ExcalidrawUtils.exportToSvg(${JSON.stringify(excalidrawDiagram)})).outerHTML;
        }
      </script>
    </body>
  `;

  const dom = new JSDOM(exportScript, { runScripts: "dangerously" });

  return dom.window.renderSvg();
}

// Embed the woff fonts. Unfortunately basically only browsers support CSS fonts in SVG.
function embedFonts(svg: string): string {
  const virgilUri = "data:application/x-font-woff2;base64," + VIRGIL_BASE64;
  const cascadiaUri = "data:application/x-font-woff2;base64," + CASCADIA_BASE64;

  // Note we have to use a function here because replaceAll() is broken.
  svg = svg.replaceAll("https://excalidraw.com/Virgil.woff2", () => virgilUri);
  svg = svg.replaceAll("https://excalidraw.com/Cascadia.woff2", () => cascadiaUri);
  return svg;
}

// Fix up the names to work with the ones you can download and install. This
// works with things like rsvg-convert.
function useLocalFonts(svg: string): string {

  // Note we have to use a function here because replaceAll() is broken.
  svg = svg.replaceAll("font-family=\"Virgil, Segoe UI Emoji\"", () => "font-family=\"Virgil GS, Segoe UI Emoji\"");
  svg = svg.replaceAll("font-family=\"Cascadia, Segoe UI Emoji\"", () => "font-family=\"Cascadia Code, Segoe UI Emoji\"");
  return svg;
}

function hasRsvgConvert(): boolean {
  try {
    child_process.execFileSync("rsvg-convert", ["--version"]);
    return true;
  } catch (error) {
    return false;
  }
}

// Convert to PDF using rsvg-convert.
function convertToPdf(inputFilename: string, outputFilename: string) {
  child_process.execFileSync("rsvg-convert", ["-f", "pdf", "-o", outputFilename, inputFilename]);
}

async function main() {

  const argv = yargs(hideBin(process.argv))
    .option("pdf", {
      description: "Additionally convert the SVGs to PDF",
      type: "boolean",
    })
    .option("rename_fonts", {
      description: "Rename the fonts from 'Virgil' to 'Virgil GS', and 'Cascadia' to 'Cascadia Code'. These match the font names you can install on your system.",
      type: "boolean",
    })
    .option("embed_fonts", {
      description: "Embed the fonts (even if they aren't used). This increases the size by about 200kB. It also only works for web browsers.",
      type: "boolean",
    })
    .help().alias("help", "h")
    .parseSync();

  if (argv._.length === 0) {
    console.error("Usage excalidraw_export <file0.excalidraw> <file1.excalidraw> ...");
    return;
  }

  if (argv.embed_fonts && argv.rename_fonts) {
    console.error("Can't embed fonts and rename them");
    return;
  }

  if (argv.pdf) {
    if (!hasRsvgConvert()) {
      console.error("PDF conversion requires `rsvg-convert`.");
      return;
    }
  }

  for (const inputFilename of argv._) {
    console.log(`Reading ${inputFilename}`);
    const outputFilename = inputFilename + ".svg";
    const input = fs.readFileSync(inputFilename, { encoding: "utf-8" });

    console.log("Converting to SVG");
    let output = await excalidrawToSvg(input);

    if (argv.embed_fonts) {
      console.log("Embedding fonts");
      output = embedFonts(output);
    }

    if (argv.rename_fonts) {
      console.log("Renaming fonts");
      output = useLocalFonts(output);
    }

    console.log(`Writing ${outputFilename}`);
    fs.writeFileSync(outputFilename, output, { encoding: "utf-8" });

    if (argv.pdf) {
      console.log("Converting to PDF");
      convertToPdf(outputFilename, inputFilename + ".pdf");
    }
  }
}

main();
