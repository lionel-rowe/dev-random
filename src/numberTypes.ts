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
	'Int8',
	'Int16',
	'Int32',
	'Uint8',
	'BigInt64',
	'Uint16',
	'Uint32',
	'BigUint64',
] as const

export type NumberTypeName = typeof numberTypes[number]
export type NumericType<T extends NumberTypeName> = T extends `Big${string}` ? bigint : number

function normalizeNumberTypeName(x: string) {
	return x.replace(/^Big/, '').replace(/^([a-z])[a-z]*/i, '$1').toLowerCase()
}

// f64, i8, i16, i32, i64, u8, u16, u32, u64
export const numberTypesNormalized: readonly string[] = numberTypes.map(normalizeNumberTypeName)
export function asNumberTypeName(type: string): NumberTypeName | null {
	const idx = numberTypesNormalized.findIndex((x) => type === x)
	return idx === -1 ? null : numberTypes[idx]!
}
