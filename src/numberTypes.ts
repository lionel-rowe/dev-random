/**
 * ```ts
 * type _NumberType = {
 * 	[K in keyof DataView]: K extends `get${infer T}`
 * 		? T extends `Float${infer N}`
 * 		// other float types not supported yet
 * 		? N extends `${64}`
 * 		? T
 * 		: never
 * 		: T
 * 		: never
 * }
 *
 * type NumberTypeName = _NumberType[keyof _NumberType]
 * ```
 */
export const numberTypes = [
	'Float64',
	'Uint8',
	'Uint16',
	'Uint32',
	'BigUint64',
	'Int8',
	'Int16',
	'Int32',
	'BigInt64',
] as const

export type NumberTypeName = typeof numberTypes[number]
export type NumericTypeOf<T extends NumberTypeShortName> = T extends `${'i' | 'u'}${64}` ? bigint : number

function shortenNumberTypeName(x: NumberTypeName): NumberTypeShortName {
	return x.replace(/^Big/, '').replace(/^([a-z])[a-z]*/i, '$1').toLowerCase() as NumberTypeShortName
}

type NumberTypeShortNameOf<T> = T extends `${'Big' | ''}Int${infer U extends number}` ? `i${U}`
	: T extends `${'Big' | ''}Uint${infer U extends number}` ? `u${U}`
	: T extends `Float${infer U extends number}` ? `f${U}`
	: never
export type NumberTypeShortName = NumberTypeShortNameOf<NumberTypeName>

export const numberTypeNameMap: ReadonlyMap<NumberTypeShortName, NumberTypeName> = new Map(numberTypes.map((x) => [
	shortenNumberTypeName(x),
	x,
]))
export const numberTypeShortNames = [...numberTypeNameMap.keys()] as const
export function isNumberTypeShortName(type: string): type is NumberTypeShortName {
	const map: ReadonlyMap<string, unknown> = numberTypeNameMap
	return map.has(type)
}
