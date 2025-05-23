import { Pcg32 } from '@std/random/_pcg32.ts'
import type { ByteGenerator } from '@std/random/_types.ts'
import { nextFloat64 } from '@std/random/number_types.ts'
import { numberTypeNameMap, NumberTypeShortName, NumericTypeOf } from './numberTypes.ts'
import { CryptoPrng } from './crypto.ts'

type Prng = Pcg32 | CryptoPrng
type SerializedPrng = `pcg32_${bigint}_${bigint}` | null

export type Output = {
	type: NumberTypeShortName
	values: number[] | `${bigint}`[]
	start: SerializedPrng | null
	resume: SerializedPrng | null
}

/** @throws {InvalidSeedError} */
export function getOutput(
	{ seed, type, count }: { seed: string | null; type: NumberTypeShortName; count: number },
): Output {
	const prng = seedToPrng(seed)
	const start = serialize(prng)

	const numbers = nextNumbers(prng.getRandomValues.bind(prng), type, count)
	const values = typeof numbers[0] === 'bigint' ? numbers.map(String) as `${bigint}`[] : numbers as number[]

	const resume = serialize(prng)

	return { type, values, start, resume }
}

function serialize(prng: Prng): SerializedPrng {
	return prng instanceof Pcg32 ? `pcg32_${prng.state}_${prng.inc}` : null
}

export function nextNumbers<T extends NumberTypeShortName>(
	byteGenerator: ByteGenerator,
	type: T,
	count: number,
): NumericTypeOf<T>[] {
	if (type === 'f64') {
		return Array.from({ length: count }, () => nextFloat64(byteGenerator) as NumericTypeOf<T>)
	}

	const numberType = numberTypeNameMap.get(type)!
	const wordSize = Math.ceil(globalThis[`${numberType}Array`].BYTES_PER_ELEMENT / 4) * 4
	const method = `get${numberType}` as const

	const b = byteGenerator(new Uint8Array(wordSize * count))
	const dv = new DataView(b.buffer)

	return Array.from({ length: count }, (_, i) => {
		const offset = i * wordSize
		return dv[method](offset, true) as NumericTypeOf<T>
	})
}

export function isPositiveIntString(value: string) {
	return /^\d+$/.test(value)
}

export class InvalidSeedError extends Error {
	override name = this.constructor.name
}

/** @throws {InvalidSeedError} */
export function seedToPrng(seed: string | null): Prng {
	if (seed == null) return CryptoPrng.instance

	if (isPositiveIntString(seed)) {
		return Pcg32.seedFromUint64(BigInt(seed))
	} else if (/^pcg32_\d+_\d+$/.test(seed)) {
		const [state, inc] = seed.split('_').slice(1).map(BigInt)
		return new Pcg32(state, inc)
	} else {
		throw new InvalidSeedError(`Invalid seed: ${seed}`)
	}
}

export function randomSeed() {
	return crypto.getRandomValues(new BigUint64Array(1))[0]!
}
