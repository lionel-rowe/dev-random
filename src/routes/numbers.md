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
			<option value="">html</option>
			<option>json</option>
		</select>
	</label>
	<button type="submit">Go</button>
	<script>
		document.currentScript.closest('form').addEventListener('submit', function () {
			const $format = this.querySelector('[name=format]')
			if (!$format.value) $format.removeAttribute('name')
		})
	</script>
</form>

{{> _pagination}}

```json
{{{results}}}
```

{{> _pagination}}
