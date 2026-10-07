import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function baseUrlFrom(value) {
  if (!value || value === '/') return '/';
  const withLeading = value.startsWith('/') ? value : `/${value}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

const config = {
  title: "Dustin's Papers",
  tagline: '논문리뷰, 작업공간, 학습공간',
  url: process.env.DOCUSAURUS_URL || 'http://localhost:3000',
  baseUrl: baseUrlFrom(process.env.DOCUSAURUS_BASE_URL),
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },
  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
    preprocessor: ({fileContent}) =>
      fileContent
        .replaceAll('\\[', '$$')
        .replaceAll('\\]', '$$')
        .replaceAll('\\(', '$')
        .replaceAll('\\)', '$'),
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'papers',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          remarkPlugins: [remarkMath],
          rehypePlugins: [[rehypeKatex, {strict: 'ignore', throwOnError: false}]],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  plugins: ['./src/search-plugin.js', './src/ask-plugin.js'],
  themeConfig: {
    navbar: {
      title: "Dustin's Papers",
      items: [
        {to: '/paper', label: '논문리뷰'},
        {to: '/work', label: '작업공간'},
        {to: '/learn', label: '학습공간'},
      ],
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
  },
};

export default config;
