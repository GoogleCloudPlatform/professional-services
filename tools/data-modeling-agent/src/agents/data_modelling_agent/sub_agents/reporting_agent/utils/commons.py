
def cleanup_metadata(metadata):
    metadata_lines = metadata.split("\n")
    cleaned_metadata_lines = []
    for line in metadata_lines:
        if "```"in line:
            continue
        cleaned_metadata_lines.append(line.strip())
    cleaned_metadata = "\n".join(cleaned_metadata_lines)
    return cleaned_metadata