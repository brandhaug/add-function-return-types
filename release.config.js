/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
	branches: ['master'],
	plugins: [
		'@semantic-release/commit-analyzer',
		'@semantic-release/release-notes-generator',
		'@semantic-release/changelog',
		'@semantic-release/npm',
		'@semantic-release/github',
		'@semantic-release/git'
	]
}
