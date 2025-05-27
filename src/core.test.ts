import { generateNumbers, getNumWordsPerElement, getResults, InvalidSeedError, seedToPrng } from './core.ts'
import type { Links, SerializedPrng } from './core.ts'
import { assert, assertAlmostEquals, assertEquals, assertInstanceOf, assertThrows } from '@std/assert'
import { Pcg32 } from './pcg32.ts'
import type { NumberTypeShortName } from './numberTypes.ts'
import { DOM_EXCEPTION_NAME } from '@li/is-dom-exception'
import { BASE_URL } from './config.ts'

const url = new URL('/numbers', BASE_URL)

function assertLinks(actual: Links | null, expected: Record<keyof Links, SerializedPrng>) {
	assert(actual != null, 'Expected links not to be `null`')

	for (const key of ['prev', 'self', 'next'] as const) {
		const qps = new URLSearchParams(actual[key])
		assertEquals(qps.get('seed'), expected[key], `mismatch for ${key}`)
	}

	return expected
}

Deno.test(getResults.name, async (t) => {
	await t.step('no seed', () => {
		const params = {
			url,
			type: 'f64',
			count: 5,
			seed: null,
		} as const

		const output = getResults(params)

		assertEquals(output.values.length, 5)
		assert(output.values.every((v) => typeof v === 'number'))
		assertEquals(output._links, null)
	})

	await t.step('no seed with large count', () => {
		const count = 25_000
		const params = {
			url,
			type: 'u64',
			count,
			seed: null,
		} as const

		const exception = assertThrows(() => crypto.getRandomValues(new BigUint64Array(count)), DOMException)
		assertEquals(exception.name, DOM_EXCEPTION_NAME.QuotaExceededError)

		const output = getResults(params)

		assertEquals(output.values.length, count)
		assertAlmostEquals(new Set<unknown>(output.values).size, count, 10)
		assert(output.values.every((v) => typeof v === 'string'))
		assertEquals(output._links, null)
	})

	await t.step('invalid seed', () => {
		const params = {
			url,
			type: 'f64',
			count: 5,
			seed: '<invalid>',
		} as const

		assertThrows(() => getResults(params), InvalidSeedError, 'Invalid seed: <invalid>')
	})

	await t.step('u8', async (t) => {
		const params = {
			url,
			type: 'u8',
			count: 10,
			seed: '0',
		} as const

		const expected = [3, 215, 211, 62, 155, 133, 142, 14, 192, 62]

		const actual = getResults(params)
		assertEquals(actual.values, expected)

		await t.step('pagination', async (t) => {
			const INC = 'ad6cad067346f087'
			const STATE_NEG_10 = '97f41772ea4fb9b4'
			const STATE_NEG_5 = '2f72931632877e2f'
			const STATE_0 = 'fc470875cce5f8be'
			const STATE_5 = 'a64299bfd5793111'
			const STATE_10 = 'c5891779a2739018'

			await t.step('from halfway', () => {
				const first = getResults({ ...params, count: 5 })
				assertEquals(first.values, expected.slice(0, 5))

				const { next } = assertLinks(
					first._links,
					{
						prev: `pcg32_${STATE_NEG_5}_${INC}`,
						self: `pcg32_${STATE_0}_${INC}`,
						next: `pcg32_${STATE_5}_${INC}`,
					},
				)

				const second = getResults({ ...params, count: 5, seed: next })
				assertEquals(second.values, expected.slice(5))

				assertLinks(
					second._links,
					{
						prev: `pcg32_${STATE_0}_${INC}`,
						self: `pcg32_${STATE_5}_${INC}`,
						next: `pcg32_${STATE_10}_${INC}`,
					},
				)

				assertEquals([...first.values, ...second.values], expected)
			})

			await t.step('from zero', () => {
				const first = getResults({ ...params, count: 0 })
				assertEquals(first.values, [])

				const { next } = assertLinks(
					first._links,
					{
						prev: `pcg32_${STATE_0}_${INC}`,
						self: `pcg32_${STATE_0}_${INC}`,
						next: `pcg32_${STATE_0}_${INC}`,
					},
				)

				const second = getResults({ ...params, seed: next })
				assertEquals(second.values, expected)

				assertLinks(
					second._links,
					{
						prev: `pcg32_${STATE_NEG_10}_${INC}`,
						self: `pcg32_${STATE_0}_${INC}`,
						next: `pcg32_${STATE_10}_${INC}`,
					},
				)
			})
		})
	})
})

Deno.test(generateNumbers.name, async (t) => {
	const tests: [NumberTypeShortName, number[] | bigint[]][] = [
		['u32', [
			298703107,
			4236525527,
			336081875,
			1056616254,
			1060453275,
			1616833669,
			501767310,
			2864049166,
			56572352,
			2362354238,
		]],
		['f64', [
			0.986392965323652,
			0.24601264253217958,
			0.37644842389200484,
			0.6668384108033093,
			0.5500284577750535,
			0.027211583252904847,
			0.4610097964014602,
			0.24912787257622104,
			0.10493815385866834,
			0.4625920669083482,
		]],
		['i64', [
			-251005486276683517n,
			4538132255688111059n,
			6944247732487142299n,
			-6145746571101709170n,
			-8300509879875978816n,
			501965112106777777n,
			8504129729690683813n,
			4595598107041274030n,
			1935767267798412705n,
			8533317468786625891n,
		]],
	]

	for (const [type, expected] of tests) {
		await t.step(type, () => {
			const prng = new Pcg32(0n)
			const actual = generateNumbers(prng, type, 10)
			assertEquals(actual, expected)
		})
	}
})

Deno.test(getNumWordsPerElement.name, () => {
	assertEquals(getNumWordsPerElement('Uint8', 1), 1)
	assertEquals(getNumWordsPerElement('Uint8', 2), 1)
	assertEquals(getNumWordsPerElement('Uint8', 4), 1)
	assertEquals(getNumWordsPerElement('Uint8', 8), 1)

	assertEquals(getNumWordsPerElement('Uint16', 1), 2)
	assertEquals(getNumWordsPerElement('Uint16', 2), 1)
	assertEquals(getNumWordsPerElement('Uint16', 4), 1)
	assertEquals(getNumWordsPerElement('Uint16', 8), 1)

	assertEquals(getNumWordsPerElement('Uint32', 1), 4)
	assertEquals(getNumWordsPerElement('Uint32', 2), 2)
	assertEquals(getNumWordsPerElement('Uint32', 4), 1)
	assertEquals(getNumWordsPerElement('Uint32', 8), 1)

	assertEquals(getNumWordsPerElement('Float64', 1), 8)
	assertEquals(getNumWordsPerElement('Float64', 2), 4)
	assertEquals(getNumWordsPerElement('Float64', 4), 2)
	assertEquals(getNumWordsPerElement('Float64', 8), 1)
})

Deno.test(seedToPrng.name, async (t) => {
	await t.step('invalid seeds', () => {
		assertThrows(() => seedToPrng(''), InvalidSeedError, 'Invalid seed: ')
		assertThrows(() => seedToPrng('<invalid>'), InvalidSeedError, 'Invalid seed: <invalid>')
		assertThrows(() => seedToPrng(`pcg32_${'f'.repeat(15)}_${'f'.repeat(16)}`), InvalidSeedError)
		assertThrows(() => seedToPrng(`pcg32_${'f'.repeat(16)}_${'f'.repeat(15)}`), InvalidSeedError)
		assertThrows(() => seedToPrng(`pcg32_${'f'.repeat(17)}_${'f'.repeat(16)}`), InvalidSeedError)
		assertThrows(() => seedToPrng(`pcg32_${'f'.repeat(16)}_${'f'.repeat(17)}`), InvalidSeedError)
	})

	await t.step('scalar u64 seed', () => {
		const prng = seedToPrng('0')
		assertInstanceOf(prng, Pcg32)
		assertEquals(prng.state, 18178507722946115774n)
		assertEquals(prng.increment, 12496553309261721735n)
	})

	await t.step('resumable state', async (t) => {
		await t.step('min', () => {
			const prng = seedToPrng(`pcg32_${'0'.repeat(16)}_${'1'.padStart(16, '0')}`)
			assertInstanceOf(prng, Pcg32)
			assertEquals(prng.state, 0n)
			assertEquals(prng.increment, 1n)
		})

		await t.step('max', () => {
			const prng = seedToPrng(`pcg32_${'f'.repeat(16)}_${'f'.repeat(16)}`)
			assertInstanceOf(prng, Pcg32)
			assertEquals(prng.state, 2n ** 64n - 1n)
			assertEquals(prng.increment, 2n ** 64n - 1n)
		})

		await t.step('odd value of `increment` is rejected', () => {
			const err = assertThrows(
				() => seedToPrng(`pcg32_${'0'.repeat(16)}_${'666'.padStart(16, '0')}`),
				InvalidSeedError,
			)
			assertEquals(err.message, 'Invalid increment: 0x0000000000000666. `increment` must be odd')
		})
	})
})
