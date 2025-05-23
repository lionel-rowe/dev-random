export class CryptoPrng {
	// singleton
	private constructor() {}
	static readonly instance = new CryptoPrng()

	getRandomValues<T extends ReturnType<Crypto['getRandomValues']>>(array: T): T {
		// 0x10_000 == 65_536.
		// See https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#exceptions
		const max = Math.floor(0x10_000 / array.BYTES_PER_ELEMENT)

		for (let i = 0; i < array.length; i += max) {
			crypto.getRandomValues(array.subarray(i, i + max))
		}

		return array
	}
}
