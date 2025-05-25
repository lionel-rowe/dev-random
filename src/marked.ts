import { Marked } from 'marked'
import markedAlert from 'marked-alert'
import { markedSmartypants } from 'marked-smartypants'
import { markedHighlight } from 'marked-highlight'
// @ts-types="@types/prismjs"
import Prism from 'prismjs'
import { escape } from '@std/html'

const langMap = new Map([
	['js', 'javascript'],
	['json', 'javascript'],
	['ts', 'javascript'],
	['typescript', 'javascript'],
])

export const marked = new Marked()
	.use(markedAlert())
	.use(markedSmartypants())
	.use(markedHighlight({
		langPrefix: 'hl language-',
		highlight(code, lang) {
			lang = langMap.get(lang) ?? lang
			if (!lang) return code
			try {
				const tokens = Prism.tokenize(code, Prism.languages[lang])

				return tokens.map(handleToken).join('')
			} catch {
				return code
			}
		},
	}))

function handleToken(t: Prism.TokenStream): string {
	return typeof t === 'string'
		? t
		: Array.isArray(t)
		? t.map(handleToken).join('')
		: t.type === 'string'
		? handleString(t)
		: wrap(t)
}

function handleString(t: Prism.Token): string {
	return typeof t.content === 'string'
		? wrap({ type: t.type, content: addLinkIfUrlLike(t.content) })
		: handleToken(t.content)
}

function addLinkIfUrlLike(string: string): string {
	if (!/^".+"$/.test(string)) {
		return escape(string)
	}

	const inner = escape(string.slice(1, -1))
	if (!/^(?:\S*\?\S+|\/\S+|https?:\/\/\S+)$/.test(inner)) {
		return `"${inner}"`
	}

	try {
		new URL(inner)
		return `"<a href="${inner}">${inner}</a>"`
	} catch {
		try {
			new URLSearchParams(inner.split('?', 2)[1])
			return `"<a href="${inner}">${inner}</a>"`
		} catch {
			return string
		}
	}
}

function wrap(t: { type: string; content: Prism.TokenStream }): string {
	return `<span class="token ${t.type}">${handleToken(t.content)}</span>`
}
