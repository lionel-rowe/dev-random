import { Pcg32 } from '@std/random/_pcg32.ts'

/** u64 variables used for `advance` */
const vars = new BigUint64Array(5) as { [Index in VarIndex]: bigint }
type VarIndex = number & { readonly AdvIndex: unique symbol }
const ACC_MULT = 0 as VarIndex
const ACC_PLUS = 1 as VarIndex
const CUR_MULT = 2 as VarIndex
const CUR_PLUS = 3 as VarIndex
const DELTA = 4 as VarIndex

/**
 * Multi-step advance (jump-ahead, jump-back)
 * @param delta The number of steps to advance. Negative values are allowed.
 *
 * See https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L60
 */
export function advance(this: Pcg32, delta: bigint) {
	vars[ACC_MULT] = 1n
	vars[ACC_PLUS] = 0n
	vars[CUR_MULT] = Pcg32.MULTIPLIER
	vars[CUR_PLUS] = this.increment

	// If a negative value was passed, it gets wrapped to positive, giving the correct result
	vars[DELTA] = delta

	while (vars[DELTA] > 0) {
		if (vars[DELTA] & 1n) {
			vars[ACC_MULT] *= vars[CUR_MULT]
			vars[ACC_PLUS] = vars[ACC_PLUS] * vars[CUR_MULT] + vars[CUR_PLUS]
		}
		vars[CUR_PLUS] = (vars[CUR_MULT] + 1n) * vars[CUR_PLUS]
		vars[CUR_MULT] *= vars[CUR_MULT]
		// 64 iterations in worst case (e.g. delta = -1 or delta = 2^64-1) due to floor-halving the u64 delta each time
		vars[DELTA] /= 2n
	}

	this.state = vars[ACC_MULT] * this.state + vars[ACC_PLUS]

	return this
}
