import { Pcg32 as Pcg32Base } from '@std/random/_pcg32.ts'

/** u64 variables used for `advance` */
const vars = new BigUint64Array(5) as { [Index in VarIndex]: bigint }
type VarIndex = number & { readonly AdvIndex: unique symbol }
const ACC_MULT = 0 as VarIndex
const ACC_PLUS = 1 as VarIndex
const CUR_MULT = 2 as VarIndex
const CUR_PLUS = 3 as VarIndex
const DELTA = 4 as VarIndex

export class Pcg32 extends Pcg32Base {
	constructor(arg: bigint | { state: bigint; increment: bigint }) {
		// `super` must be called with `{ state, increment }` to ensure it returns a `Pcg32` not a `Pcg32Base`. This is
		// an implementation detail in the `Pcg32Base` constructor. As a workaround, in the `seed: bigint` case, we
		// redundantly create a `Pcg32Base` to read its `state` and `increment` properties.
		super(typeof arg === 'bigint' ? new Pcg32Base(arg) : arg)
	}

	/**
	 * Multi-step advance (jump-ahead, jump-back)
	 * @param delta The number of steps to advance. Negative values are allowed.
	 *
	 * See https://github.com/rust-random/rand/blob/f7bbcca/rand_pcg/src/pcg64.rs#L60
	 */
	advance(delta: bigint) {
		vars[ACC_MULT] = 1n
		vars[ACC_PLUS] = 0n
		vars[CUR_MULT] = Pcg32.MULTIPLIER
		vars[CUR_PLUS] = this.increment

		// If a negative value was passed, it gets wrapped to positive, giving the correct result
		vars[DELTA] = delta

		while (vars[DELTA] > 0n) {
			if (vars[DELTA] & 1n) {
				vars[ACC_MULT] *= vars[CUR_MULT]
				vars[ACC_PLUS] = vars[ACC_PLUS] * vars[CUR_MULT] + vars[CUR_PLUS]
			}
			vars[CUR_PLUS] = (vars[CUR_MULT] + 1n) * vars[CUR_PLUS]
			vars[CUR_MULT] *= vars[CUR_MULT]
			// Floor-halving each iteration, max 64 iterations for initial wrapped delta in [2^63, 2^64)
			vars[DELTA] /= 2n
		}

		this.state = vars[ACC_MULT] * this.state + vars[ACC_PLUS]

		return this
	}
}
