# La Brute Reskin Studio

This directory contains a minimal setup for a local React + PixiJS application that visualises **La Brute** characters and allows you to swap body parts, weapons and other assets.

The project is intentionally lightweight so you can extend it with your own build tooling and assets. It is meant to run entirely offline.

## Setup

1. Install [Node.js](https://nodejs.org/) (version 18 or newer).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. The application will open at `http://localhost:5173`.

## Adding assets

1. Export assets from the `LaBrute.fla` file using `labrute-fla-parser`:
   ```bash
   npx labrute-fla-parser --input LaBrute.fla --output ./export
   ```
2. Import the generated `SymbolXXX.ts` modules in `src/avatar/AvatarBrute.tsx` and compose your brute.

Refer to the main project documentation for a detailed workflow.
