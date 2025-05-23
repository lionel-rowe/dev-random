import { STATUS_CODE } from '@std/http/status'
import { normalize } from '@std/path'
import { home } from './html.ts'
import { err, numbers } from './api.ts'
import { serveDir } from '@std/http/file-server'

Deno.serve((req) => {
	const url = new URL(req.url)
	const pathname = normalizePathname(url.pathname)
	if (pathname !== url.pathname) {
		return Response.redirect(Object.assign(url, { pathname }), STATUS_CODE.PermanentRedirect)
	}

	switch (url.pathname) {
		case '/':
			return req.method === 'GET' ? home(req) : err(STATUS_CODE.MethodNotAllowed)
		case '/numbers':
			return req.method === 'GET' ? numbers(req) : err(STATUS_CODE.MethodNotAllowed)
		default: {
			if (pathname.startsWith('/static/')) {
				return serveDir(req, {
					fsRoot: 'static',
					urlRoot: 'static',
					showIndex: false,
				})
			}
			return err(STATUS_CODE.NotFound)
		}
	}
})

function normalizePathname(pathname: string) {
	pathname = normalize(pathname || '/')
	return /.\/$/.test(pathname) ? pathname.slice(0, -1) : pathname
}
