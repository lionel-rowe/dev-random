# `dev-random`

Generate pseudo-random numbers of various numeric types, optionally using a seeded PRNG using the PCG32 algorithm.

## Request

<pre><code>GET <a href="{{href}}">{{path}}</a></code></pre>

- **`type`**: The type of numbers to generate. Must be one of {{{numberTypeList}}}.
  > [!NOTE]
  > For `u64` and `i64`, the numbers will be returned as strings to avoid losing accuracy when parsing from JSON.

- **`count`**: The quantity of random numbers to generate. Must be a non-negative integer ≤ {{maxCount}}.

- **`seed`**: The seed to use for the random number generator.
  - If set to a u64 integer, that will be used to seed the PRNG.
  - If set to the string `none`, a non-seeded PRNG will be used.
  - If set to `pcg32_<state>_<inc>`, the `state` and `inc` values will be used to initialize the PRNG. This is
    the format returned in the `seed` query param of the `_links` in the response and can be used to "paginate" through
    the random number stream.
  - If omitted or empty, a random PRNG `state` and `inc` will be generated, and the request will be redirected.

## Response

```json
{{{results}}}
```

- **`type`**: The type of numbers generated. This will be the same as the `type` parameter in the request.
- **`values`**: An array of random numbers generated. For `u64` and `i64`, these will be returned as strings to avoid
  losing accuracy when parsing from JSON.
- **`_links`**: Relative links to more results, resuming from the same state, containing the PRNG's state in the `seed`
  query param. `_links` will be `null` if a non-seeded PRNG was used.
