import json
import sys

def transform(event):
  """ Return a Dict or List of Dict Objects.  Return None to discard """
  event['mike'] = 'is cool'
  
  # Ensure Table Dest Exists
  # event['_metadata_dataset'] = event.get('_metadata_dataset') or 'alooma'
  # event['_metadata_table'] = event.get('_metadata_table') or 'dylan_test'

  return clean_transformed_event(event)

def clean_transformed_event(event):
  for col in event:
    if type(event[col]) in [dict, list]:
      event[col] = json.dumps(event[col])

  return json.dumps(event)

def _handle_result(result):
  if isinstance(result, list):
    for event in result:
      if event:
        print(event)
  elif result:
    print(result)

if __name__ == '__main__':
  # TODO: How do we handle the case where there are no messages
  file_name = sys.argv[1]
  with open(file_name, "r") as data_file:
    for cnt, raw_data in enumerate(data_file):
      raw_events = "[%s]" % raw_data

      data = json.loads(raw_events)

      if isinstance(data, list):
        for event in data:
          _handle_result(transform(event))
      else:
        event = data
        _handle_result(transform(event))
  exit()
