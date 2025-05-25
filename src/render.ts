import { listFmt, MAX_COUNT, numFmt, SITE_TITLE } from './config.ts'
import { getResults } from './core.ts'
import { numberTypeShortNames } from './numberTypes.ts'
// @ts-types="@types/mustache"
import Mustache from 'mustache'

export const templateUrl = new URL(import.meta.resolve('../src/routes/home.md'))

export const populateTemplate: typeof Mustache.render = (template, values, ...args): string => {
	const proxy = new Proxy(values, {
		get(target, prop, receiver) {
			if (!Reflect.has(target, prop)) throw new Error(`Missing value for key: ${String(prop)}`)
			return Reflect.get(target, prop, receiver)
		},
	})

	return Mustache.render(template, proxy, ...args)
}

function makeBreadcrumbs(url: URL): string {
	const segments = ['Home', ...url.pathname.split('/').filter(Boolean)]
	const breadcrumbs = segments.map((part, idx) => {
		if (idx === segments.length - 1) return part

		const href = '/' + segments.slice(1, idx + 1).join('/')
		return `<a href="${href}">${part}</a>`
	}).map((x) => `<li>${x}</li>`).join(' › ')
	return `<ul class="breadcrumbs">${breadcrumbs}</ul>`
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

export async function populateReadme({ seed, baseUrl }: { seed: bigint; baseUrl: string }) {
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
		results: JSON.stringify(results, null, 4),
		maxCount: numFmt.format(MAX_COUNT),
	})

	return content
}
