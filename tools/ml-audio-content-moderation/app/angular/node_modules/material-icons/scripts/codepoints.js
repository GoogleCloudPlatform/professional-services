const fs = require('fs')
const path = require('path')
const { EOL } = require('os')

const SRC = path.resolve(__dirname + '/../iconfont/codepoints')
const DST_JSON = path.resolve(__dirname + '/../iconfont/codepoints.json')
const DST_SCSS = path.resolve(__dirname + '/../iconfont/codepoints.scss')

const lines = fs
  .readFileSync(SRC)
  .toString()
  .split(EOL)
const codepoints = {}
let map = ''

lines.forEach(line => {
  const [name, codepoint] = line
    .trim()
    .split(' ')
    .map(v => v.trim())
  if (!name || !codepoint) {
    return
  }
  codepoints[name] = codepoint
  map += `  "${name}": ${codepoint},${EOL}`
})

map = map.replace(/,\s*$/, '')
const mapName = '$material-icons-codepoints'
map = `${mapName}: () !default;
${mapName}: map-merge((
${map}
), ${mapName});
`

fs.writeFileSync(DST_JSON, JSON.stringify(codepoints, null, 2))
fs.writeFileSync(DST_SCSS, map)
