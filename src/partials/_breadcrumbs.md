<ul class="breadcrumbs">
	{{#breadcrumbs}}
		{{#href}}
			<a href="{{href}}">{{part}}</a><span class="breadcrumb-delimiter">›</span>
		{{/href}}
		{{^href}}
			{{part}}
		{{/href}}
	{{/breadcrumbs}}
</ul>
