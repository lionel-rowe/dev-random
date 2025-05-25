import { listFmt, MAX_COUNT, numFmt, SITE_TITLE } from './config.ts'
import { getResults } from './core.ts'
import { numberTypeShortNames } from './numberTypes.ts'

export const templateUrl = new URL(import.meta.resolve('../src/routes/home.md'))

export function populateTemplate(
	template: string,
	values: Record<string, string>,
): string {
	const map = new Map<string, string>(Object.entries(values))

	return template
		.replaceAll(/\{\{(\w+)\}\}/g, (_, key) => {
			const value = map.get(key)
			if (value == null) {
				throw new Error(`Missing value for key: ${key}`)
			}
			return value
		})
}

export async function populateLayout({ title, main }: { title: string | null; main: string }): Promise<string> {
	return populateTemplate(
		await Deno.readTextFile('./src/routes/_layout.html'),
		{ title: title == null ? SITE_TITLE : `${title} · ${SITE_TITLE}`, main },
	)
}

export async function populateReadme({ seed, baseUrl }: { seed: bigint; baseUrl: string }) {
	const params = {
		type: 'f64',
		count: 5,
		seed: String(seed),
	} as const

	const url = new URL('/numbers', baseUrl)
	url.search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

	const href = url.href
	const path = href.slice(url.origin.length)
	const numberTypeList = listFmt.format(numberTypeShortNames.map((x) => `\`${x}\``))

	const results = getResults(params)

	const content = populateTemplate(await Deno.readTextFile(templateUrl), {
		href,
		path,
		numberTypeList,
		output: JSON.stringify(results, null, 4),
		maxCount: numFmt.format(MAX_COUNT),
	})

	return content
}
