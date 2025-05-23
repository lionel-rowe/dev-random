import { listFmt, MAX_COUNT, numFmt } from '../config.ts'
import { getOutput } from '../core.ts'
import { numberTypeShortNames } from '../numberTypes.ts'

export const templateUrl = new URL(import.meta.resolve('./template.md'))

export async function populateReadme(seed: bigint) {
	const params = {
		type: 'f64',
		count: 5,
		seed: String(seed),
	} as const

	const url = new URL('/numbers', 'https://null')
	url.search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

	const path = url.href.slice(url.origin.length)
	const numberTypeList = listFmt.format(numberTypeShortNames.map((x) => `\`${x}\``))

	const res = getOutput(params)

	const content = populateTemplate(await Deno.readTextFile(templateUrl), {
		path,
		numberTypeList,
		output: JSON.stringify(res, null, '\t'),
		maxCount: numFmt.format(MAX_COUNT),
	})

	return content
}

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
