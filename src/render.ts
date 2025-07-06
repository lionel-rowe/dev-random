import { listFmt, MAX_COUNT, numFmt, SITE_TITLE } from './config.ts'
import { getResults } from './core.ts'
import { numberTypeShortNames } from './numberTypes.ts'
// @ts-types="@types/mustache"
import Mustache from 'mustache'
import { LruCache, memoize } from '@std/cache'
import { toSentenceCase } from '@std/text/unstable-to-sentence-case'

export const templateUrl = new URL(import.meta.resolve('../src/routes/home.md'))

const lookupPartial = memoize((name: string) => {
	return Deno.readTextFileSync(new URL(`${name}.md`, import.meta.resolve('../src/partials/')))
	// deno-lint-ignore no-explicit-any
}, { cache: new LruCache<any, any>(100) })

export function populateTemplate(template: string, values: object): string {
	const proxy = new Proxy(values, {
		get(target, prop, receiver) {
			if (!Reflect.has(target, prop)) throw new Error(`Missing value for key: ${String(prop)}`)
			return Reflect.get(target, prop, receiver)
		},
	})

	return Mustache.render(template, proxy, lookupPartial)
}

function makeBreadcrumbs(url: URL) {
	const segments = ['Home', ...url.pathname.split('/').filter(Boolean)]
	return segments.map((part, idx) => {
		part = toSentenceCase(part)
		if (idx === segments.length - 1) return { href: null, part }

		const href = '/' + segments.slice(1, idx + 1).join('/')
		return { href, part }
	})
}

export async function populateLayout(
	req: Request,
	{ title, main }: { title: string | null; main: string },
): Promise<string> {
	const url = new URL(req.url)
	const breadcrumbs = makeBreadcrumbs(url)

	return populateTemplate(
		await Deno.readTextFile('./src/routes/_layout.html'),
		{ title: title == null ? SITE_TITLE : `${title} · ${SITE_TITLE}`, main, breadcrumbs },
	)
}

export async function populateReadme(props: { seed: bigint; baseUrl: string; indent?: '\t' | 2 | 4 | 8 }) {
	const { seed, baseUrl, indent = '\t' } = props
	const url = new URL('/numbers', baseUrl)

	const params = {
		type: 'f64',
		count: 10,
		seed: String(seed),
	} as const

	url.search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

	const href = url.href
	const path = href.slice(url.origin.length)
	const numberTypeList = listFmt.format(numberTypeShortNames.map((x) => `\`${x}\``))

	const results = getResults({ url, ...params })

	const content = populateTemplate(await Deno.readTextFile(templateUrl), {
		href,
		path,
		numberTypeList,
		results: JSON.stringify(results, null, indent),
		maxCount: numFmt.format(MAX_COUNT),
	})

	return content
}
