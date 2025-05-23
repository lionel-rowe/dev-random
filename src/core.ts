import { Pcg32 } from '@std/random/_pcg32.ts'
import type { ByteGenerator } from '@std/random/_types.ts'
import { nextFloat64 } from '@std/random/number_types.ts'
import { numberTypeNameMap, NumberTypeShortName, NumericTypeOf } from './numberTypes.ts'

/** @throws {InvalidSeedError} */
export function getOutput(
	{ seed, type, count }: { seed: string | null; type: NumberTypeShortName; count: number },
): { values: number[] | string[]; resume: string | null } {
	const prng = seedToPrng(seed)

	const numbers = nextNumbers(prng.getRandomValues.bind(prng), type, count)
	const values = typeof numbers[0] === 'bigint' ? numbers.map(String) : numbers as number[]

	const resume = prng instanceof Pcg32 ? `pcg32_${prng.state}_${prng.inc}` : null

	return { values, resume }
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
export function seedToPrng(seed: string | null): { getRandomValues: ByteGenerator } {
	if (seed == null) return { getRandomValues: cryptoGetRandomValues }

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

function cryptoGetRandomValues(b: Uint8Array): Uint8Array {
	// 0x10000 == 65,536.
	// See https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#exceptions
	const max = Math.floor(0x10000 / b.BYTES_PER_ELEMENT)

	for (let i = 0; i < b.length; i += max) {
		crypto.getRandomValues(b.subarray(i, i + max))
	}

	return b
}
