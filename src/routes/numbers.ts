import { isRedirectStatus, STATUS_CODE, STATUS_TEXT, type StatusCode } from '@std/http/status'
import { isNumberTypeShortName, numberTypeShortNames } from '../numberTypes.ts'
import { listFmt, MAX_COUNT, numFmt } from '../config.ts'
import { getRandomPcg32, getResults, InvalidSeedError, isPositiveIntString, type Results, serialize } from '../core.ts'
import { DOM_EXCEPTION_NAME, isDomException } from '@li/is-dom-exception'
import { accepts } from '@std/http/negotiation'
import { populateLayout, populateTemplate } from '../render.ts'
import { marked } from '../marked.ts'
import { contentType } from '@std/media-types/content-type'

export const numbers = jsonOrHtml((req: Request): Response => {
	const url = new URL(req.url)
	const { searchParams } = url

	const type = searchParams.get('type')
	const _seed = searchParams.get('seed')

	const _count = searchParams.get('count')

	if (!_seed) {
		searchParams.set('seed', serialize(getRandomPcg32()))
		return Response.redirect(url, STATUS_CODE.TemporaryRedirect)
	}

	const seed = _seed === 'none' ? null : _seed

	if (type == null) {
		return err(STATUS_CODE.BadRequest, '`type` is required')
	}
	if (!isNumberTypeShortName(type)) {
		return err(STATUS_CODE.BadRequest, `\`type\` must be one of ${listFmt.format(numberTypeShortNames)}`)
	}

	if (_count == null) {
		return err(STATUS_CODE.BadRequest, '`count` is required')
	}
	if (!isPositiveIntString(_count)) {
		return err(STATUS_CODE.BadRequest, '`count` must be a positive integer')
	}
	const count = Number(_count)
	if (count > MAX_COUNT) {
		return err(STATUS_CODE.BadRequest, `\`count\` cannot exceed ${numFmt.format(MAX_COUNT)}`)
	}

	let results: Results
	try {
		results = getResults({ seed, type, count, url })
	} catch (e) {
		if (e instanceof InvalidSeedError) {
			return err(STATUS_CODE.BadRequest, e.message)
		} else if (isDomException(e, DOM_EXCEPTION_NAME.QuotaExceededError)) {
			// `crypto.getRandomValues` may throw this error due to oversized typed array.
			// However, this should never happen in practice, as we've wrapped the function to iterate in such cases.
			return err(STATUS_CODE.InternalServerError, e.message)
		}
		throw e
	}

	return Response.json(results)
})

export function err(status: StatusCode, message?: string) {
	const statusText = STATUS_TEXT[status]
	return Response.json({
		code: status,
		error: [STATUS_TEXT[status], message].filter(Boolean).join(': '),
	}, { status, statusText })
}

function jsonOrHtml(fn: (req: Request) => Response | Promise<Response>) {
	return async (req: Request): Promise<Response> => {
		const { searchParams } = new URL(req.url)
		const override = searchParams.get('format')
		const accept = accepts(req, 'application/json', 'text/html')
		const res = await fn(req)
		const ct = accepts(res, 'application/json', 'text/html')

		const rerenderAsHtml = isRedirectStatus(res.status) || override === 'json'
			? false
			: override === 'html'
			? true
			: (accept === 'text/html' && ct === 'application/json')

		if (rerenderAsHtml) {
			try {
				const form = Object.fromEntries(searchParams.entries())
				const types = numberTypeShortNames.map((type) => ({
					type,
					selected: type === form.type,
				}))

				const results: Results = await res.json()

				const content = populateTemplate(await Deno.readTextFile('./src/routes/numbers.md'), {
					results: JSON.stringify(results, null, '\t'),
					form,
					types,
					links: results._links,
				})

				const main = await marked.parse(content)
				const html = await populateLayout(req, { title: 'Playground', main })

				return new Response(html, {
					headers: {
						'content-type': contentType('html'),
					},
				})
			} catch (e) {
				console.error(e)
			}
		}

		return res
	}
}
