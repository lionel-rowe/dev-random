# `dev-random`

Generate pseudo-random numbers of various numeric types, optionally using a seeded PRNG.

The seeded PRNG uses the PCG32 algorithm.

## Request

### Example

<pre><code>GET <a href="{{path}}">{{path}}</a></code></pre>

### Parameters

- **`type`**: The type of numbers to generate. Must be one of {{numberTypeList}}.
  > [!NOTE]
  > For `u64` and `i64`, the numbers will be returned as strings to avoid losing accuracy when parsing JSON.

- **`count`**: The quantity of random numbers to generate. Must be a non-negative integer ≤ {{maxCount}}.

- **`seed`**: The seed to use for the random number generator.
  - If set to a non-negative integer, that will be used as a u64 seed.
  - If set to the string `none`, a non-seeded PRNG will be used.
  - If omitted or empty, a random seed will be generated, and the request will be redirected to the URL with the
    seed specified.
  - If set to `pcg32_<state>_<inc>`, the `state` and `inc` values will be used to resume the PRNG. This is
    the format returned in the `resume` field of the response and can be used to "paginate" through the random
    number stream.

## Response

### Example

```json
{{output}}
```

### Fields

- **`values`**: An array of random numbers generated.
- **`resume`**: Resumable state that can be used to generate more numbers. This will be `null` if a non-seeded
  PRNG was used.
