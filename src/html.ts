import { contentType } from '@std/media-types/content-type'
import { marked } from './marked.ts'
import { populateReadme, populateTemplate } from './docs/populate.ts'
import { randomSeed } from './core.ts'

export async function home(_req: Request): Promise<Response> {
	const readme = await populateReadme(randomSeed())
	const main = await marked.parse(readme)
	const html = populateTemplate(await Deno.readTextFile('./src/docs/boilerplate.html'), { main })

	return new Response(html, {
		headers: {
			'content-type': contentType('html'),
		},
	})
}
