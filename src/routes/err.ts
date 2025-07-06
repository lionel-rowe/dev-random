import { STATUS_TEXT, type StatusCode } from '@std/http/status'

export function err(status: StatusCode, message?: string) {
	const statusText = STATUS_TEXT[status]
	return Response.json({
		code: status,
		error: [STATUS_TEXT[status], message].filter(Boolean).join(': '),
	}, { status, statusText })
}
