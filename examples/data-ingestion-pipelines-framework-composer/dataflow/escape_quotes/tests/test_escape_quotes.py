def test_escape_double_quotes():
  from escape_quotes_package.escape_quotes import EscapeDoubleQuotes
  res = EscapeDoubleQuotes().process('"aaa","b"b""b","ccc"')
  print(res)
  expected_result = ['"aaa","b""b""""b","ccc"']
  assert res == expected_result