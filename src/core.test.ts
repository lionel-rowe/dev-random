import { getOutput, InvalidSeedError, nextNumbers } from './core.ts'
import { assert, assertAlmostEquals, assertEquals, assertThrows } from '@std/assert'
import { Pcg32 } from '@std/random/_pcg32.ts'
import type { NumberTypeShortName } from './numberTypes.ts'
import { DOM_EXCEPTION_NAME } from '@li/is-dom-exception'

Deno.test(getOutput.name, async (t) => {
	await t.step('no seed', () => {
		const params = {
			type: 'f64',
			count: 5,
			seed: null,
		} as const

		const output = getOutput(params)

		assertEquals(output.values.length, 5)
		assert(output.values.every((v) => typeof v === 'number'))
		assertEquals(output.resume, null)
	})

	await t.step('no seed with large count', () => {
		const count = 25_000
		const params = {
			type: 'u64',
			count,
			seed: null,
		} as const

		const exception = assertThrows(() => crypto.getRandomValues(new BigUint64Array(count)), DOMException)
		assertEquals(exception.name, DOM_EXCEPTION_NAME.QuotaExceededError)

		const output = getOutput(params)

		assertEquals(output.values.length, count)
		assertAlmostEquals(new Set<unknown>(output.values).size, count, 10)
		assert(output.values.every((v) => typeof v === 'string'))
		assertEquals(output.resume, null)
	})

	await t.step('invalid seed', () => {
		const params = {
			type: 'f64',
			count: 5,
			seed: '<invalid>',
		} as const

		assertThrows(() => getOutput(params), InvalidSeedError, 'Invalid seed: <invalid>')
	})

	await t.step('u8', async (t) => {
		const params = {
			type: 'u8',
			count: 10,
			seed: '0',
		} as const

		const expected = [3, 215, 211, 62, 155, 133, 142, 14, 192, 62]

		const actual = getOutput(params)
		assertEquals(actual.values, expected)

		await t.step('resume', async (t) => {
			const INC = 12496553309261721735n
			const STATE_0 = 18178507722946115774n
			const STATE_5 = 11980307007958233361n
			const STATE_10 = 14233933908465127448n

			await t.step('from halfway', () => {
				const first = getOutput({ ...params, count: 5 })
				assertEquals(first.values, expected.slice(0, 5))
				assertEquals(first.start, `pcg32_${STATE_0}_${INC}`)
				assertEquals(first.resume, `pcg32_${STATE_5}_${INC}`)

				const second = getOutput({ ...params, count: 5, seed: first.resume })
				assertEquals(second.values, expected.slice(5))
				assertEquals(second.start, first.resume)
				assertEquals(second.resume, `pcg32_${STATE_10}_${INC}`)

				assertEquals([...first.values, ...second.values], expected)
			})

			await t.step('from zero', () => {
				const first = getOutput({ ...params, count: 0 })
				assertEquals(first.values, [])
				assertEquals(first.start, `pcg32_${STATE_0}_${INC}`)
				assertEquals(first.resume, first.start)

				const second = getOutput({ ...params, seed: first.resume })
				assertEquals(second.values, expected)
				assertEquals(second.start, first.resume)
				assertEquals(second.resume, `pcg32_${STATE_10}_${INC}`)
			})
		})
	})
})

Deno.test(nextNumbers.name, async (t) => {
	const tests: [NumberTypeShortName, (bigint | number)[]][] = [
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
			const prng = Pcg32.seedFromUint64(0n)
			const actual = nextNumbers(prng.getRandomValues.bind(prng), type, 10)
			assertEquals(actual, expected)
		})
	}
})
