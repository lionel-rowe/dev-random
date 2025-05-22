import dedent from 'string-dedent'
import { Marked } from 'marked'
import markedAlert from 'marked-alert'
import { listFmt, MAX_COUNT, numFmt } from './config.ts'
import { numberTypesNormalized } from './numberTypes.ts'
import { randomSeed } from './core.ts'
import { numbers } from './api.ts'

const marked = new Marked({ breaks: true, async: false }).use(markedAlert())
const markup = (md: string): string => {
	return marked.parse(md) as Exclude<ReturnType<typeof marked.parse>, Promise<unknown>>
}

const css = dedent`
body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
	tab-size: 4;
}
main {
	max-width: 800px;
	margin: 0 auto;
	margin-top: 2rem;
}
.markdown-alert {
	margin-block: 0.6em;
	border-left: 0.25em solid var(--alert-color);
	padding: 0.3em 1em;
	background: color-mix(in srgb, var(--alert-color), #fff 90%);
}
.markdown-alert > :first-child {
	margin-top: 0;
}
.markdown-alert > :last-child {
	margin-bottom: 0;
}
.markdown-alert .markdown-alert-title {
	display: flex;
	align-items: center;
	gap: 0.5em;
	font-weight: bold;
	color: var(--alert-color);
	margin: 0;
}
.markdown-alert-note {
	--alert-color: dodgerblue;
}
.markdown-alert-tip {
	--alert-color: forestgreen;
}
.markdown-alert-important {
	--alert-color: rebeccapurple;
}
.markdown-alert-warning {
	--alert-color: darkorange;
}
.markdown-alert-caution {
	--alert-color: crimson;
}

.markdown-alert p:not([class]) {
	margin-top: 0.3rem;
	font-size: 0.9rem;
}
`

export async function home(_req: Request): Promise<Response> {
	const path = `/numbers?type=f64&count=5&seed=${randomSeed()}`
	const numberTypeList = listFmt.format(numberTypesNormalized.map((x) => `\`${x}\``))

	const res = await numbers(new Request(new URL(path, 'https://null'))).json()

	const content = dedent`
	# \`dev-random\`
	
	Generate pseudo-random numbers of various numeric types, optionally using a seeded PRNG.
	
	The seeded PRNG uses the PCG32 algorithm.
	
	## Request
	
	### Example
	
	<pre><code>GET <a href="${path}">${path}</a></code></pre>
	
	### Parameters
	
	*  **\`type\`**: The type of number to generate. Must be one of ${numberTypeList}.
	   > [!NOTE]
	   > For 64-bit integer types, the numbers will be returned as strings to avoid losing accuracy when parsing JSON.

	*  **\`count\`**: The number of random numbers to generate. Must be a positive integer ≤ ${
		numFmt.format(MAX_COUNT)
	}.

	*  **\`seed\`**: The seed to use for the random number generator.
	   -  If set to a positive integer, that will be used as a u64 seed.
	   -  If omitted, a non-seeded PRNG will be used.
	   -  If supplied but empty (\`?seed=\`), a random seed will be generated, and the request
		  will be redirected to the URL with the seed specified.
	   -  If set to \`pcg32_<state>_<inc>\`, the \`state\` and \`inc\` values will be used to resume the PRNG. This is
	      the format returned in the \`resume\` field of the response.

	## Response
	
	### Example
	
	~~~
	${JSON.stringify(res, null, '\t')}
	~~~
	
	### Fields
	*  **\`values\`**: An array of random numbers generated.
	*  **\`resume\`**: Resumable state that can be used to generate more numbers. This will be \`null\` if a non-seeded
	   PRNG was used.
	`

	const html = dedent`
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Random Number Generator</title>
			<style>${css}</style>
		</head>
		<body><main>${markup(content)}</main></body>
	</html>
	`

	return new Response(html, {
		headers: {
			'content-type': 'text/html',
		},
	})
}
