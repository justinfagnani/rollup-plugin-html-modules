import type {Plugin, PluginImpl} from 'rollup';

/**
 * Transforms HTML files to support the HTML modules proposal, which enables
 * importing HTML into JavaScript modules.
 *
 * This plugin enables HTML module support in Rollup by transforming HTML files
 * that are imported with a `{type: 'html'}` attribute into JavaScript modules
 * that export DOM nodes.
 */
export const htmlModules: PluginImpl = (): Plugin => {
  return {
    name: 'html-modules',
    transform(code, id) {
      const isHtmlModule = this.getModuleInfo(id)?.attributes.type === 'html';
      if (isHtmlModule) {
        // Escape the HTML source so that it can be used in a template literal.
        const escapedCode = code
          // Preserve any escape sequences in the source:
          .replace('\\', '\\\\')
          // Escape backticks:
          .replace(/`/g, '\\`')
          // Escape ${} interpolation:
          .replace(/\$/g, '\\$');
        // TODO: export elements by id by parsing the HTML at build time.
        return `
const parser = new DOMParser();
const doc = parser.parseFromString(\`${escapedCode}\`, 'text/html');
export default doc;
        `;
      }
      return null;
    },
  };
};
