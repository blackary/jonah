import { defineConfig } from 'vite';

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'jonah';
  const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';

  return {
    base: isPagesBuild ? `/${repoName}/` : '/',
    server: {
      host: '127.0.0.1',
      port: 4173,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
  };
});
