import { Pcg32 } from '@std/random/_pcg32.ts'
import { advance } from './advance.ts'
import { assertEquals } from '@std/assert'

Deno.test(advance.name, () => {
	let pcg = new Pcg32(0n)
	const { state, increment } = pcg
	const u32_0 = pcg.nextUint32()

	assertEquals(advance.call(pcg, -1n).nextUint32(), u32_0)

	for (let i = 0; i < 999; ++i) {
		pcg.step()
	}
	const u32_1000 = pcg.nextUint32()

	// reset to initial state
	pcg = new Pcg32({ state, increment })

	assertEquals(advance.call(pcg, 1000n).nextUint32(), u32_1000)

	advance.call(pcg, -1001n)
	assertEquals(pcg.nextUint32(), u32_0)
})
