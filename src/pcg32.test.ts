import { Pcg32 } from './pcg32.ts'
import { assertEquals } from '@std/assert'

Deno.test(Pcg32.prototype.advance.name, () => {
	let pcg = new Pcg32(0n)
	const { state, increment } = pcg
	const u32_0 = pcg.nextUint32()

	assertEquals(pcg.advance(-1n).nextUint32(), u32_0)

	for (let i = 0; i < 999; ++i) {
		pcg.step()
	}
	const u32_1000 = pcg.nextUint32()

	// reset to initial state
	pcg = new Pcg32({ state, increment })

	assertEquals(pcg.advance(1000n).nextUint32(), u32_1000)

	pcg.advance(-1001n)
	assertEquals(pcg.nextUint32(), u32_0)
})
