import { STATUS_CODE, STATUS_TEXT, type StatusCode } from '@std/http/status'
import { Pcg32 } from '@std/random/_pcg32.ts'
import { asNumberTypeName, numberTypes } from './numberTypes.ts'
import { listFmt, MAX_COUNT, numFmt } from './config.ts'
import { isPositiveIntString, nextNumbers, randomSeed, seedToPrng } from './core.ts'

export function numbers(req: Request): Response {
	const url = new URL(req.url)
	const params = url.searchParams
	const _seed = params.get('seed')

	if (_seed === '') {
		params.set('seed', String(randomSeed()))
		return Response.redirect(url, STATUS_CODE.TemporaryRedirect)
	}

	const _type = params.get('type')
	const _count = params.get('count')

	if (_type == null) {
		return err(STATUS_CODE.BadRequest, '`type` is required')
	}
	const type = asNumberTypeName(_type)
	if (type == null) {
		return err(STATUS_CODE.BadRequest, `\`type\` must be one of ${listFmt.format(numberTypes)}`)
	}

	if (_count == null) {
		return err(STATUS_CODE.BadRequest, '`count` is required')
	}
	if (!isPositiveIntString(_count)) {
		return err(STATUS_CODE.BadRequest, '`count` must be a positive integer')
	}
	const count = Number(_count)
	if (count > MAX_COUNT) {
		return err(STATUS_CODE.BadRequest, `\`count\` cannot exceed ${numFmt.format(MAX_COUNT)}`)
	}

	const prng = seedToPrng(_seed)

	const numbers = nextNumbers(prng.getRandomValues.bind(prng), type, count)
	const values = typeof numbers[0] === 'bigint' ? numbers.map(String) : numbers

	const resume = prng instanceof Pcg32 ? `pcg32_${prng.state}_${prng.inc}` : null

	return Response.json({ values, resume })
}

export function err(status: StatusCode, message?: string) {
	const statusText = STATUS_TEXT[status]
	return Response.json({
		code: status,
		error: [STATUS_TEXT[status], message].filter(Boolean).join(': '),
	}, { status, statusText })
}
