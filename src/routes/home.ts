import { contentType } from '@std/media-types/content-type'
import { marked } from '../marked.ts'
import { randomU64 } from '../core.ts'
import { populateLayout, populateReadme } from '../render.ts'

export async function home(req: Request): Promise<Response> {
	const readme = await populateReadme({ seed: randomU64(), baseUrl: new URL(req.url).origin })
	const main = await marked.parse(readme)
	const html = await populateLayout(req, { title: null, main })

	return new Response(html, {
		headers: {
			'content-type': contentType('html'),
		},
	})
}
