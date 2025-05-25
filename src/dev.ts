await Promise.all([
	import('./main.ts'),
	import('../scripts/watchReadme.ts'),
])
