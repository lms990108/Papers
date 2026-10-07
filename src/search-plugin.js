const fs = require('fs');
const path = require('path');

function bodyOf(markdown) {
  const withoutFrontMatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  return withoutFrontMatter
    .replace(/```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\$+/g, ' ')
    .replace(/\\[()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = function papersSearch() {
  return {
    name: 'papers-search',
    async allContentLoaded({allContent, actions}) {
      const versions =
        allContent['docusaurus-plugin-content-docs']?.default?.loadedVersions ??
        [];
      const pages = [];
      for (const version of versions) {
        for (const doc of version.docs) {
          if (!doc.source) {
            continue;
          }
          const rel = doc.source.replace(/^@site\//, '');
          const raw = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
          pages.push({
            title: doc.title,
            url: doc.permalink,
            body: bodyOf(raw),
          });
        }
      }
      actions.setGlobalData({pages});
    },
  };
};
