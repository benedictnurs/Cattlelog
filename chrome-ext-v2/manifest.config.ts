import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Cattlelog for Chrome',
  description:
    'An easier way to pick the right classes and export them to your calendar',
  version: pkg.version,
  icons: {
    '16': 'public/icon128.png',
    '32': 'public/icon128.png',
    '48': 'public/icon128.png',
    '128': 'public/icon128.png',
  },
  action: {
    default_icon: {
      '16': 'public/icon128.png',
      '32': 'public/icon128.png',
      '48': 'public/icon128.png',
      '128': 'public/icon128.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://my.ucdavis.edu/schedulebuilder/index.cfm?*'],
    },
  ],
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://api.daviscattlelog.com/*'],
});
