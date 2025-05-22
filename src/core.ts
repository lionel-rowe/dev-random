import { Pcg32 } from '@std/random/_pcg32.ts'
import type { ByteGenerator } from '@std/random/_types.ts'
import { nextFloat64 } from '@std/random/number_types.ts'
import { NumberTypeName, NumericType } from './numberTypes.ts'

export function nextNumbers<T extends NumberTypeName>(
	byteGenerator: ByteGenerator,
	numberType: T,
	count: number,
): NumericType<T>[] {
	if (numberType === 'Float64') {
		return Array.from({ length: count }, () => nextFloat64(byteGenerator) as NumericType<T>)
	}

	const wordSize = Math.ceil(globalThis[`${numberType}Array`].BYTES_PER_ELEMENT / 4) * 4

	const b = byteGenerator(new Uint8Array(wordSize * count))
	const dv = new DataView(b.buffer)

	return Array.from({ length: count }, (_, i) => {
		const offset = i * wordSize
		return dv[`get${numberType}`](offset, true) as NumericType<T>
	})
}

export function isPositiveIntString(value: string) {
	return /^\d+$/.test(value)
}

export function seedToPrng(seed: string | null): { getRandomValues: ByteGenerator } {
	if (seed == null) {
		return crypto
	}

	if (isPositiveIntString(seed)) {
		return Pcg32.seedFromUint64(BigInt(seed))
	} else if (/^pcg32_\d+_\d+$/.test(seed)) {
		const [state, inc] = seed.split('_').slice(1).map(BigInt)
		return new Pcg32(state, inc)
	} else {
		throw new Error(`Invalid seed: ${seed}`)
	}
}

export function randomSeed() {
	return crypto.getRandomValues(new BigUint64Array(1))[0]!
}
