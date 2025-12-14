/**
 * Rollup Configuration for Nekrasov Editor
 *
 * This configuration produces three output formats:
 * 1. UMD - Universal Module Definition for direct browser usage via <script> tags
 * 2. ESM - ES Modules for modern bundlers (Vite, webpack 5+, Rollup)
 * 3. CJS - CommonJS for Node.js and older bundlers
 *
 * @see https://rollupjs.org/configuration-options/
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';

// =============================================================================
// Build Constants
// =============================================================================

const BUILD_CONFIG = {
	// Entry point for the library
	INPUT_FILE: 'src/index.ts',

	// Output directory and file names
	OUTPUT_DIR: 'dist',
	OUTPUT_UMD: 'dist/nekrasov.umd.js',
	OUTPUT_CJS: 'dist/nekrasov.cjs.js',
	OUTPUT_ESM: 'dist/nekrasov.esm.js',
	OUTPUT_CSS: 'style.css',

	// Library name for UMD global variable (window.Nekrasov)
	LIBRARY_NAME: 'Nekrasov',

	// TypeScript configuration file
	TSCONFIG_PATH: './tsconfig.json'
};

// =============================================================================
// External Dependencies
// =============================================================================

/**
 * Dependencies marked as external are NOT bundled into the output.
 *
 * For ESM/CJS builds: These are expected to be installed by the consumer
 * and will be imported at runtime. This keeps the bundle size small and
 * allows consumers to deduplicate shared dependencies.
 *
 * For UMD build: These are bundled in (via resolve plugin) to create
 * a standalone file that works without any module system.
 */
const EXTERNAL_DEPENDENCIES = [
	// HTML sanitization
	'dompurify',

	// Markdown parsing
	'markdown-it',

	// ProseMirror core packages - these form the foundation of the editor
	'prosemirror-commands',      // Basic editing commands
	'prosemirror-dropcursor',    // Drop cursor visualization
	'prosemirror-gapcursor',     // Cursor in empty blocks
	'prosemirror-history',       // Undo/redo support
	'prosemirror-inputrules',    // Input transformation rules
	'prosemirror-keymap',        // Keyboard shortcut handling
	'prosemirror-menu',          // Menu bar UI
	'prosemirror-model',         // Document model
	'prosemirror-schema-list',   // List handling
	'prosemirror-state',         // Editor state management
	'prosemirror-tables',        // Table editing support
	'prosemirror-transform',     // Document transformations
	'prosemirror-view'           // Editor view/rendering
];

/**
 * UMD Global Variable Mappings
 *
 * When building UMD format, Rollup needs to know what global variables
 * correspond to external dependencies. This is only used when the UMD
 * build is used without a module bundler (direct <script> tag usage).
 *
 * These mappings follow each library's documented global export name.
 */
const UMD_GLOBALS = {
	'dompurify': 'DOMPurify',
	'markdown-it': 'markdownit',
	'prosemirror-commands': 'prosemirrorCommands',
	'prosemirror-dropcursor': 'prosemirrorDropcursor',
	'prosemirror-gapcursor': 'prosemirrorGapcursor',
	'prosemirror-history': 'prosemirrorHistory',
	'prosemirror-inputrules': 'prosemirrorInputrules',
	'prosemirror-keymap': 'prosemirrorKeymap',
	'prosemirror-menu': 'prosemirrorMenu',
	'prosemirror-model': 'prosemirrorModel',
	'prosemirror-schema-list': 'prosemirrorSchemaList',
	'prosemirror-state': 'prosemirrorState',
	'prosemirror-tables': 'prosemirrorTables',
	'prosemirror-transform': 'prosemirrorTransform',
	'prosemirror-view': 'prosemirrorView'
};

// =============================================================================
// Plugin Configurations
// =============================================================================

/**
 * Creates the CSS extraction plugin configuration.
 * Extracts all CSS imports into a single file.
 */
const createCssPlugin = () => css({
	output: BUILD_CONFIG.OUTPUT_CSS
});

/**
 * Creates TypeScript plugin configuration.
 *
 * @param {Object} options - Additional options
 * @param {boolean} options.emitDeclarations - Whether to emit .d.ts files
 */
const createTypescriptPlugin = ({ emitDeclarations = false } = {}) => typescript({
	tsconfig: BUILD_CONFIG.TSCONFIG_PATH,
	declaration: emitDeclarations,
	declarationDir: emitDeclarations ? BUILD_CONFIG.OUTPUT_DIR : undefined,
	sourceMap: true
});

// =============================================================================
// Build Configurations
// =============================================================================

/**
 * UMD Build Configuration
 *
 * Produces a self-contained bundle that works in browsers via <script> tag.
 * All dependencies are bundled in, making it larger but standalone.
 *
 * Usage:
 *   <script src="nekrasov.umd.js"></script>
 *   <script>
 *     const editor = new Nekrasov.NekrasovEditor({ target: element });
 *   </script>
 */
const umdBuild = {
	input: BUILD_CONFIG.INPUT_FILE,
	output: {
		name: BUILD_CONFIG.LIBRARY_NAME,
		file: BUILD_CONFIG.OUTPUT_UMD,
		format: 'umd',
		globals: UMD_GLOBALS,
		sourcemap: true
	},
	plugins: [
		createCssPlugin(),
		resolve({ browser: true }),
		commonjs(),
		createTypescriptPlugin({ emitDeclarations: true })
	]
};

/**
 * ESM/CJS Build Configuration
 *
 * Produces optimized bundles for use with module bundlers.
 * Dependencies are external to allow tree-shaking and deduplication.
 *
 * ESM Usage (modern bundlers, Node.js with "type": "module"):
 *   import { NekrasovEditor } from 'nekrasov';
 *
 * CJS Usage (Node.js, older bundlers):
 *   const { NekrasovEditor } = require('nekrasov');
 */
const moduleBuild = {
	input: BUILD_CONFIG.INPUT_FILE,
	external: EXTERNAL_DEPENDENCIES,
	output: [
		{
			file: BUILD_CONFIG.OUTPUT_CJS,
			format: 'cjs',
			sourcemap: true
		},
		{
			file: BUILD_CONFIG.OUTPUT_ESM,
			format: 'es',
			sourcemap: true
		}
	],
	plugins: [
		createCssPlugin(),
		createTypescriptPlugin({ emitDeclarations: false })
	]
};

// =============================================================================
// Export
// =============================================================================

export default [umdBuild, moduleBuild];
