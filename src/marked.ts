import { Marked } from 'marked'
import markedAlert from 'marked-alert'
import { markedSmartypants } from 'marked-smartypants'

export const marked = new Marked()
	.use(markedAlert())
	.use(markedSmartypants())
