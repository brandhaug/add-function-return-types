export default {
	'*.{ts,tsx,js,jsx,json,css}': ['oxfmt --write'],
	'*.{ts,tsx,js,jsx}': ['oxlint --type-aware --fix']
}
