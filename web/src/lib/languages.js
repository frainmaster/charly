// Every folder in src/languages/ with a meta.json is a language; no registration needed.
const metas = import.meta.glob('../languages/*/meta.json', { eager: true, import: 'default' });
const files = import.meta.glob('../languages/*/*.json', { eager: true, import: 'default' });

export const languages = Object.entries(metas).map(([path, meta]) => {
  const dir = path.slice(0, path.lastIndexOf('/'));
  return {
    id: dir.split('/').pop(),
    name: meta.name,
    scripts: meta.scripts.map((id) => {
      const cards = files[`${dir}/${id}.json`];
      if (!cards) throw new Error(`${dir}/meta.json lists "${id}" but ${id}.json is missing`);
      return { id, cards };
    }),
  };
});
