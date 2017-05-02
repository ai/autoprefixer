Prefixer = require('./prefixer')
utils    = require('./utils')

n2f = require('num2fraction')

regexp = /(min|max)-resolution\s*:\s*\d*\.?\d+(dppx|dpi)/gi
split  = /(min|max)-resolution(\s*:\s*)(\d*\.?\d+)(dppx|dpi)/i

class Resolution extends Prefixer

  # Return prefixed query name
  prefixName: (prefix, name) ->
    name = if prefix == '-moz-'
      name + '--moz-device-pixel-ratio'
    else
      prefix + name + '-device-pixel-ratio'

  # Return prefixed query
  prefixQuery: (prefix, name, colon, value, units) ->
    value = Number(value / 96) if units == 'dpi'
    value = n2f(value) if prefix == '-o-'
    @prefixName(prefix, name) + colon + value

  # Remove prefixed queries
  clean: (rule) ->
    unless @bad
      @bad = []
      for prefix in @prefixes
        @bad.push( @prefixName(prefix, 'min') )
        @bad.push( @prefixName(prefix, 'max') )

    rule.params = utils.editList rule.params, (queries) =>
      queries.filter (query) => @bad.every( (i) -> query.indexOf(i) == -1 )

  # Add prefixed queries
  process: (rule) ->
    parent   = @parentPrefix(rule)
    prefixes = if parent then [parent] else @prefixes

    # Find defined device pixel ratio's
    min_ratio = rule.params.match(/min-device-pixel-ratio\s*:\s*(\d*\.?\d+)/i)
    max_ratio = rule.params.match(/max-device-pixel-ratio\s*:\s*(\d*\.?\d+)/i)

    rule.params = utils.editList rule.params, (origin, prefixed) =>
      for query in origin
        if query.indexOf('min-resolution') == -1 and
           query.indexOf('max-resolution') == -1
          prefixed.push(query)
          continue

        for prefix in prefixes
          if prefix == '-moz-' and rule.params.indexOf('dpi') != -1
            continue
          else
            processed = query.replace regexp, (str) =>
              parts = str.match(split)
              value = parts[3]
              units = parts[4]
              # If there is a device pixel ratio defined, use that instead of calculating it
              if min_ratio || max_ratio
                value = if parts[1] == 'min' then min_ratio[1] else max_ratio[1]
                units = 'ratio'
              @prefixQuery(prefix, parts[1], parts[2], value, units)
            prefixed.push(processed)
        prefixed.push(query)

      utils.uniq(prefixed)

module.exports = Resolution
