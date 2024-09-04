# How to build

It's a standard NPM process:

```
npm install
npm run compile
```

`npm run compile` runs the `compile.mjs` Node script which runs Typescript `tsc` to compile `main.ts` to `dist/main.js` and then modifies that file to embed the fonts, Excalidraw code, and canvas polyfill.

# How to release

1. Edit `package.json` to change the version.
2. Run `npm install` so it gets updated in `package.lock`.
3. Commit & push.
4. Run `npm run compile` to generate `dist/main.js`.
5. Run `npm publish`.
