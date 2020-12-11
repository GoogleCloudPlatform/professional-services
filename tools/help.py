import bq_to_xml

print(bq_to_xml.bigquery_to_xml("""SELECT * FROM `bigquery-public-data.samples.github_nested` ORDER BY repository.url DESC LIMIT 5"""))
