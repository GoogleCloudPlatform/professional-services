function transform(line) {
  var values = line.split(',');

  var obj = new Object();
  obj.id = values[0];
  obj.customer_id = values[1];
  obj.item = values[2];
  obj.price = values[3];
  obj.timestamp = values[4];
  var jsonString = JSON.stringify(obj);

  return jsonString;
}