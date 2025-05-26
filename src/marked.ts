import { Marked } from 'marked'
import markedAlert from 'marked-alert'
import { markedSmartypants } from 'marked-smartypants'
import { markedHighlight } from 'marked-highlight'
// @ts-types="@types/prismjs"
import Prism from 'prismjs'

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
				return Prism.highlight(code, Prism.languages[lang], lang)
			} catch {
				return code
			}
		},
	}))
