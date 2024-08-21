import re
import json


def load_json(path):
    """Loads a JSON file from the given path."""
    with open(path, 'r') as f:
        data = json.load(f)
    return data


def write_json(data, path):
    """Writes a JSON dictionary to the given path."""
    with open(path, 'w') as f:
        json.dump(data, f)


def clean_text(pdf_json):
    try:
        for page in pdf_json['pages']:
            text = page['texts']['full_text']
            unicode_pattern = r"[\u0080-\uFFFF]"
            filtered_text = re.sub('\\s{2,}', ' ',
                                   re.sub(unicode_pattern, '', text))
            page['texts']['full_text'] = filtered_text.\
                replace(":", "").replace("\n", " ").\
                replace("{", "(").\
                replace("[", "(").\
                replace("}", ")").\
                replace("]", ")").\
                replace("(", "").\
                replace(")", "").strip()
        print("[INFO]: Text cleaning completed successfully.")
        return pdf_json
    except Exception as e:
        print(f"[ERROR]: Error during text cleaning - {e}")
        return {}


def get_company_text(text_list):
    try:
        if len(text_list) == 1:
            return text_list[0]["texts"]["full_text"]
        elif len(text_list) > 4:
            return f"""{text_list[0]['texts']['full_text']} \
            {text_list[1]['texts']['full_text']} \
            {text_list[-2]['texts']['full_text']} \
            {text_list[-1]['texts']['full_text']}"""
        else:
            return f"""{text_list[0]['texts']['full_text']}\
                       {text_list[-1]['texts']['full_text']}"""
    except IndexError as e:
        print(f"[ERROR]: Found an empty list in PDF JSON - {e}")
        return ""
    except Exception as e:
        print(f"[ERROR]: Unknown error during company text extraction - {e}")


def order_text(page):
    page_dict = page.get_text('dict')

    paragraphs = dict()
    for block in page_dict['blocks']:
        x_coordinate = block['bbox'][0]
        if x_coordinate in paragraphs.keys():
            paragraphs[x_coordinate].append(block['number'])
        else:
            paragraphs[x_coordinate] = [block['number']]

    para_list = []
    for x_coord, block_numbers in paragraphs.items():
        para = []
        for bno in block_numbers:
            for block in page_dict['blocks']:
                if block['number'] == bno:
                    if 'lines' in block.keys():
                        try:
                            for line in block['lines']:
                                for span in line['spans']:
                                    print(span['text'])
                                    para.append(span['text'])
                        except Exception:
                            print("problem", block)
            # print(page_dict['blocks'][bno]['lines'][0])
        para_list.append(para)

    ordered_text = "\n".join(para_list)

    return ordered_text
