var includes  = require('./includes')
  , attr = require('./attr')
  , all = require('./all')

module.exports = function form(root) {
  var name = attr('name')
    , values = {}
    , invalid = []

  all('[name]', root)
    .map(function(el){ 
      var n = name(el)
        , v = values[n] = 
            typeof el.state == 'object' && 'value' in el.state ? el.state.value 
          : el.files                        ? el.files
          : el.type == 'checkbox'           ? (values[n] || []).concat(el.checked ? el.value : [])
          : el.type == 'radio'              ? (el.checked ? el.value : values[n])
                                            : el.value

      if (includes('is-invalid')(el.className)) invalid.push(el)
    })

  return { values: values, invalid: invalid }
}