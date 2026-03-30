import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWebExtend } from '@web-extend/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginWebExtend({
      manifest: {
        icons: {
          "16": "./src/assets/cory-logo.png",
          "32": "./src/assets/cory-logo.png",
          "48": "./src/assets/cory-logo.png",
          "128": "./src/assets/cory-logo.png"
        }
      }
    })
  ],
});
