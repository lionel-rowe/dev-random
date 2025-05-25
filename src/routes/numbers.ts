import { STATUS_CODE, STATUS_TEXT, type StatusCode } from '@std/http/status'
import { isNumberTypeShortName, numberTypeShortNames } from '../numberTypes.ts'
import { listFmt, MAX_COUNT, numFmt } from '../config.ts'
import { getRandomPcg32, getResults, InvalidSeedError, isPositiveIntString, type Results, serialize } from '../core.ts'
import { DOM_EXCEPTION_NAME, isDomException } from '@li/is-dom-exception'

export function numbers(req: Request): Response {
	const url = new URL(req.url)
	const { searchParams } = url

	const type = searchParams.get('type')
	const _seed = searchParams.get('seed')
	const _start = searchParams.get('start')

	const _count = searchParams.get('count')

	if (!_seed && !_start) {
		searchParams.set('start', serialize(getRandomPcg32()))
		return Response.redirect(url, STATUS_CODE.TemporaryRedirect)
	}

	const seed = _seed === 'none' ? null : _seed

	if (type == null) {
		return err(STATUS_CODE.BadRequest, '`type` is required')
	}
	if (!isNumberTypeShortName(type)) {
		return err(STATUS_CODE.BadRequest, `\`type\` must be one of ${listFmt.format(numberTypeShortNames)}`)
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

	let results: Results
	try {
		results = getResults({ seed, type, count, searchParams })
	} catch (e) {
		if (e instanceof InvalidSeedError) {
			return err(STATUS_CODE.BadRequest, e.message)
		} else if (isDomException(e, DOM_EXCEPTION_NAME.QuotaExceededError)) {
			// `crypto.getRandomValues` may throw this error due to oversized typed array.
			// However, this should never happen in practice, as we've wrapped the function to iterate in such cases.
			return err(STATUS_CODE.InternalServerError, e.message)
		}
		throw e
	}

	return Response.json(results)
}

export function err(status: StatusCode, message?: string) {
	const statusText = STATUS_TEXT[status]
	return Response.json({
		code: status,
		error: [STATUS_TEXT[status], message].filter(Boolean).join(': '),
	}, { status, statusText })
}
