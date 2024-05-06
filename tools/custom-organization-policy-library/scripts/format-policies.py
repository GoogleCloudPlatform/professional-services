import yaml, os, sys

def main():
  if len(sys.argv) < 2:
    print("Usage: python3 format-policies.py <source_yaml> <output_dir>")
    return

  input_file = sys.argv[1]
  output_dir = sys.argv[2]
  print(f"processing: {input_file}, output directory: {output_dir}")

  with open(input_file, 'r') as infile:
    for i, doc in enumerate(yaml.safe_load_all(infile)):
      filename = doc.get("filename", "file_not_found")
      directory = doc.get("service", "dir_not_found")
      del doc["filename"]
      del doc["service"]

      os.makedirs(f"{output_dir}/{directory}", exist_ok = True)
      
      output_file = f"{output_dir}/{directory}/{filename}"
      with open(output_file, 'w') as outfile:
        print(output_file)
        yaml.dump(doc, outfile)

if __name__ == "__main__":
  main()
