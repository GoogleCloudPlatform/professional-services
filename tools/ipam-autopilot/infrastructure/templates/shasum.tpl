%{ for file in zips }${filesha256(format("./.temp/%s", file))} ${file}
%{ endfor }