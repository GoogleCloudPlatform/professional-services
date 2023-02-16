function transform(line) {
  var values = line.split(',');

  var obj = new Object();
  obj.id = values[0]
  obj.name = values[1];
  obj.surname = values[2];
  obj.timestamp = values[3];
  var jsonString = JSON.stringify(obj);

  return jsonString;
}