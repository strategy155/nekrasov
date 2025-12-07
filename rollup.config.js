import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';

const external = [
	'dompurify',
	'markdown-it',
	'prosemirror-commands',
	'prosemirror-dropcursor',
	'prosemirror-gapcursor',
	'prosemirror-history',
	'prosemirror-inputrules',
	'prosemirror-keymap',
	'prosemirror-menu',
	'prosemirror-model',
	'prosemirror-schema-list',
	'prosemirror-state',
	'prosemirror-tables',
	'prosemirror-transform',
	'prosemirror-view'
];

export default [
	// UMD build for browsers (includes all dependencies)
	{
		input: 'src/index.ts',
		output: {
			name: 'Nekrasov',
			file: 'dist/nekrasov.umd.js',
			format: 'umd',
			globals: {
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
			},
			sourcemap: true
		},
		plugins: [
			css({ output: 'style.css' }),
			resolve({ browser: true }),
			commonjs(),
			typescript({
				tsconfig: './tsconfig.json',
				declaration: true,
				declarationDir: 'dist',
				sourceMap: true
			})
		]
	},

	// ESM and CJS builds for bundlers (external dependencies)
	{
		input: 'src/index.ts',
		external,
		output: [
			{
				file: 'dist/nekrasov.cjs.js',
				format: 'cjs',
				sourcemap: true
			},
			{
				file: 'dist/nekrasov.esm.js',
				format: 'es',
				sourcemap: true
			}
		],
		plugins: [
			css({ output: 'style.css' }),
			typescript({
				tsconfig: './tsconfig.json',
				declaration: false,
				sourceMap: true
			})
		]
	}
];
