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
	<button type="submit">Go</button>
</form>

```json
{{{results}}}
```

{{#prev}}<a href="{{prev}}">‹ Prev</a>{{/prev}}
{{#next}}<a href="{{next}}">Next ›</a>{{/next}}
