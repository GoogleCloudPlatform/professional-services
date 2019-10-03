module.exports = function pause(stream) {
  var pipeline = []
  stream.save  = stream.pipe
  stream.pipe  = pipe
  stream.flow  = flow
  return stream

  function pipe(dest) {
    pipeline.push(dest)
    return stream
  }

  function flow() {
    while (pipeline.length) 
      stream = (stream.save || stream.pipe).call(stream, pipeline.shift())
    return stream
  }
}