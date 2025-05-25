# Playground

<form action="" method="get">
	<label>
		Type
		<select name="type">
			{{#types}}
				<option {{#selected}}selected{{/selected}}>{{type}}</option>
			{{/types}}
		</select>
	</label>
	<label>
		Count
		<input type="number" min="0" max="10000" step="1" name="count" value="{{form.count}}">
	</label>
	<label>
		Seed
		<input name="seed" value="{{form.seed}}">
	</label>
	<label>
		Format
		<select name="format">
			<option>html</option>
			<option>json</option>
		</select>
	</label>
	<button type="submit">Go</button>
	<script>
		document.currentScript.closest('form').addEventListener('submit', (e) => {
			const f = e.currentTarget.querySelector('[name=format]')
			if (f.value === 'html') f.removeAttribute('name')
		})
	</script>
</form>

```json
{{{results}}}
```

{{#prev}}<a href="{{prev}}">‹ Prev</a>{{/prev}}
{{#next}}<a href="{{next}}">Next ›</a>{{/next}}
