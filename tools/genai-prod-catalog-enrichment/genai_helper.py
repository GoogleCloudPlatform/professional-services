# gen AI helper
import re
import json
import ast
import traceback
import fitz
import vertexai
from vertexai.language_models import TextGenerationModel
from google.cloud import storage
# from pdf_helper import *


def get_blocked_response_template():
    blocked_response = {
        "response_error": {
            "is_blocked": True,
            "safety_attributes": {},
            "message": "The response is blocked because the input or "
                       "response potentially violates Google’s policies. "
                       "Try rephrasing the prompt or "
                       "adjusting the parameter settings."
        }
    }
    return blocked_response


def get_failed_faq_template():
    failed_faq = {
        "catalogue_faqs": [
            {
                "response_error": "",
                "llm_response": ""
            }
        ]
    }
    return failed_faq


def get_model_response(prompt, project):
    """API request to PaLM 2 LLM"""

    vertexai.init(project=project, location="us-central1")

    parameters = {
        "candidate_count": 1,
        "max_output_tokens": 2048,
        "temperature": 0,
        "top_p": 0.8,
        "top_k": 40
    }

    model = TextGenerationModel.from_pretrained("text-bison")

    response = model.predict(prompt, **parameters)
    return response


def get_prompt(context, task, error="", product_name=""):
    """Gets the prompt for the given task."""

    # FAQ's, ISQ's constants

    faq_json_format = """{
        "catalogue_faqs": [
            {"question": "What is the size of the paper
            napkin produced by this machine?",
            "answer": "The paper napkin produced by
            this machine is 30 X 30 cm."},
            {"question": "What is the speed of this machine?",
            "answer": "This machine can produce 2,50,000 pieces in 8 hours."},
            {"question": "How many colors can this machine print?",
            "answer": "This machine can print up to 2 colors."},
            {"question": "What is the weight of this machine?",
            "answer": "This machine weighs approximately 2500 kgs."},
            {"question": "How many people are required
            to operate this machine?",
            "answer": "This machine requires one
            operator and one helper to operate."},
            {"question": "What type of raw material does this machine use?",
            "answer": "This machine uses tissue paper with a gsm of 12 to 30."}
        ]
    }"""

    sample_json_response = {

        "product_name": [
            "SINGLE SIZE PAPER NAPKIN MACHINE",
        ],
        "specifications": [
            {
                "SINGLE SIZE PAPER NAPKIN MACHINE": {
                    "Size": "30 X 30 CM",
                    "No of Printing": "As Per Requirement",
                    "Embossing Unit": "As Per Requirement",
                    "Motor": [
                        "3hp motor with variable"
                        " AC drive with VDF (Variable frequency drive)",
                        "1hp motor (AC)"
                    ],
                    "Speed": "2,50,000 PIECES / 8 HOURS",
                    "Weight": "2500 kgs (approx)",
                    "Man Power": "One operator & One helper",
                    "Raw Material": "Tissue paper 12 to 30 gsm",
                    "Counting": "digital",
                    "PRICE WITHOUT PRINT": "4,50,000",
                    "1 COLOUR PRINT": "5,75,000",
                    "2 COLOUR PRINT": "6,25,000"
                }}],
        "confidence_score": 0.8
    }

    company_details_format = {
        "company_details": {
            "company_name": "Global Conversion Machines",
            "company_description": "",
            "company_phone_number": {
                "SALES TEAM": "+ 91 958 215 2344",
                "MARKETING TEAM": "+ 91 874 482 8924",
                "SERVICE TEAM": "+ 91 888 291 3467"
            },
            "company_email": "globalconversionmachines@gmail.com",
            "company_website": "",
            "company_social_handles": {
                "twitter": "@globalcmachines",
                "instagram": "@globalconversionmachines",
                "youtube": "Global Conversion Machines"
            },
            "company_address": ""
        }
    }

    # blocked_response = get_blocked_response_template()
    malformed_json = """
    {
        'product_name': ['Acrylic Body Rotameter'],
        'specifications': [
            {'Acrylic Body Rotameter': {
                'Metering Tube': 'Solid Acrylic Block',
                'Body': 'Imported transparent acrylic block',
                'Wetted Parts': 'M.S. / S.S. / P.P. / Teflon',
                'End Connection': 'S.S. 304/316/PVC/PP/MS',
                'Scale': 'Engraved on body',
                'Packing': 'Neoprene / Teflon / Silicon',
                'Model': 'JP/ABR',
                'Temperature': 'Max 60C',
                'Pressure': 'Max 25 Kg/Cm',
                'Available sizes': '1/8 to 100 NB',
                'Flow Ranges': '2 to 60,000 LPH of water at
                ambient temperature and 0.1 to 750 Nm/hr of air at NTP',
                'End Connection': 'Screwed / Flanged / Hose Nipple',
                'Orientation': 'Bottom Top / Rear Rear',
                'Accuracy': '2% of FSD',
                'Accessories': 'High & low flow alarms and 4-20
                mA output on your request',
                'THREDED CONNECTION': {
                    'Line Size Flow rate (BSP CONNECTION)':
                    'Water at amb.temp. in LPH',
                    'Minimum LPH': 'Maximum LPH',
                    'BSP 6': '60',
                    'BSP 200': '2000',
                    'BSP 400': '4000',
                    '1 BSP': '500',
                    '1.5 BSP': '1200',
                    '2 BSP': '2500'
                    }
                }
             },
            'confidence_score': 0.8
            }
    """

    fixed_json = """
    {
    "product_name": [
    "Acrylic Body Rotameter"
    ],
    "specifications": [
    {
    "Acrylic Body Rotameter": {
    "Metering Tube": "Solid Acrylic Block",
    "Body": "Imported transparent acrylic block",
    "Wetted Parts": "M.S. / S.S. / P.P. / Teflon",
    "End Connection": "S.S. 304/316/PVC/PP/MS",
    "Scale": "Engraved on body",
    "Packing": "Neoprene / Teflon / Silicon",
    "Model": "JP/ABR",
    "Temperature": "Max 60C",
    "Pressure": "Max 25 Kg/Cm",
    "Available sizes": "1/8 to 100 NB",
    "Flow Ranges": "2 to 60,000 LPH of water
    at ambient temperature and 0.1
    to 750 Nm/hr of air at NTP",
    "End Connection": "Screwed / Flanged / Hose Nipple",
    "Orientation": "Bottom Top / Rear Rear",
    "Accuracy": "2% of FSD",
    "Accessories": "High & low flow alarms and 4-20 mA output on your request",
    "THREDED CONNECTION": {
    "Line Size Flow rate (BSP CONNECTION)": "Water at amb.temp. in LPH",
    "Minimum LPH": "Maximum LPH",
    "BSP 6": "60",
    "BSP 200": "2000",
    "BSP 400": "4000",
    "1 BSP": "500",
    "1.5 BSP": "1200",
    "2 BSP": "2500"
    }
    }
    }
    ],
    "confidence_score": 0.9
    }
    """

    non_woven_bag = {
        "tags": ["Industrial Machine", "Bag Making Machine"],
        "suggested_category": "Non Woven Bag Making Machine"
    }

    toilet_roll_machine = {
        "tags": ["Industrial Machine",
                 "Paper Roll Machine", "Toilet Roll Machine"],
        "suggested_category": "Toilet Roll Making Machine"
    }

    malformed_faq = """
    {
        "catalogue_faqs": [
            {"question": "What is the purpose of this diagram?",
            "answer": "This diagram shows the piping and wiring
            schematic for an AO Smith heat pump water heater."},
            {"question": "What are the different components
            shown in the diagram?",
            "answer": "The diagram shows the following components:
            1)    Hot water to rooms
            2)    Tank temp sensor
            3)    Hot water outlet
            4)    Flow switch
            5)    Vibration pads
            6)    Return water from rooms
            7)    Cold water inlet to heat pump
            8)    FFL note"},
            {"question": "What are the different
            steps involved in the operation of this system?",
            "answer": "The steps involved in the
            operation of this system are as follows:
            1)    Cold water enters the heat pump through the cold water inlet.
            2)    The heat pump heats the water
            and sends it to the hot water tank.
            3)    The hot water is then distributed to the
            rooms through the hot water to rooms pipes.
            4)    The return water from the rooms is then sent back to the
            heat pump through the return water from rooms pipes.
            5)    The process repeats itself."},
            {"question": "What are some of the important safety precautions
            that should be taken when working on this system?",
            "answer": "Some of the important safety precautions
            that should be taken when working on this system include:
            1)    Always turn off the power to the system before working on it.
            2)    Be sure to use proper safety equipment,
            such as gloves and eye protection.
            3)    Never work on the system while it is hot.
            4)    Be aware of the location of
            all of the components in the system.
            5)    If you are unsure about anything,
            always consult a qualified professional."}
        ]
    }
    """

    fixed_faq = """
    {"catalogue_faqs": [{"question": "What is the purpose of this diagram?",
    "answer": "This diagram shows the piping and wiring schematic
    for an AO Smith heat pump water heater."},
    {"question": "What are the different components shown in the diagram?",
    "answer": "The diagram shows the following
    components:\n1) Hot water to rooms\n2) Tank temp sensor\n
    3) Hot water outlet\n4) Flow switch\n
    5) Vibration pads\n6) Return water from rooms\n
    7) Cold water inlet to heat pump\n8) FFL note"},
    {"question": "What are the different
     steps involved in the operation of this system?",
    "answer": "The steps involved in the
    operation of this system are as follows:\n
    1) Cold water enters the heat pump through the cold water inlet.\n
    2) The heat pump heats the water and sends it to the hot water tank.\n
    3) The hot water is then distributed to the
    rooms through the hot water to rooms pipes.\n
    4) The return water from the rooms is then
    sent back to the heat pump through the return water from rooms pipes.\n
    5) The process repeats itself."},
    {"question": "What are some of the important
    safety precautions that should be taken when working on this system?",
    "answer": "Some of the important safety
    precautions that should be taken when working on this system include:\n
    1) Always turn off the power to the system before working on it.\n
    2) Be sure to use proper safety equipment,
    such as gloves and eye protection.\n
    3) Never work on the system while it is hot.\n
    4) Be aware of the location of all of the components in the system.\n
    5) If you are unsure about anything,
    always consult a qualified professional."}]}
    """

    # failed_faq = get_failed_faq_template()

    check_faq_prompt = f"""For the following text,
    examine if it contains a description,
    product specifications or features.
    If found, return a boolean response True.
     If not found, return a boolean response False.

    {context}"""

    faq_prompt = f"""Generate a list of frequently asked
    questions (FAQ) based only on the provided input.

    Extract the key points, common queries,
    and important details to create a concise
    and informative set of questions and
    answers that would provide clarity on this subject for readers.

    Return the output in JSON format.
    input: 02 SINGLE SIZE PAPER NAPKIN
    MACHINE Size: 30 X 30 CM No of Printing :
    As Per Requirement Embossing Unit:
    As Per Requirement Motor: 1) 3hp motor with variable
    AC drive with VDF (Variable frequency drive)
     2) 1hp motor (AC) Speed: 2,50,000 PIECES / 8 HOURS
    Weight: 2500 kgs (approx) Man Power: One operator &
    One helper Raw Material:
    Tissue paper 12 to 30 gsm Counting: digital Counting Band saw
     cutting with mauling sharping system PRICE WITHOUT PRINT : `4,50,000
     1 COLOUR PRINT : `5,75,000 2 COLOUR PRINT : `6,25,000
    output: {faq_json_format}

    input: {context}
    output:
    """

    check_specs_prompt = f"""For the following text, examine
    if it contains a product description, specifications
    or features. If found, return a boolean response True.
     If not found, return a boolean response False.

    {context}
    """

    product_specs_prompt = f"""Convert the following text into a
    product specifications JSON containing \"product_name\"
    and other \"specifications\".
    Also, add a \"confidence_score\" to the end of the JSON.

    input: 02 SINGLE SIZE PAPER NAPKIN MACHINE
     Size: 30 X 30 CM No of Printing : As Per Requirement Embossing Unit:
    As Per Requirement Motor: 1) 3hp
    motor with variable AC drive with VDF (Variable frequency drive)
    2) 1hp motor (AC) Speed: 2,50,000 PIECES / 8
    HOURS Weight: 2500 kgs (approx) Man Power: One operator &
    One helper Raw Material: Tissue paper 12 to
    30 gsm Counting: digital Counting Band saw
     cutting with mauling sharping system
     PRICE WITHOUT PRINT :
     `4,50,000 1 COLOUR PRINT :
     `5,75,000 2 COLOUR PRINT : `6,25,00
    output: {sample_json_response}

    input: {context}
    output:
    """

    company_details_prompt = f"""Convert the following
    text into a JSON containing company details.
    Ensure that the details extracted
    are based solely on the content of the
    following text and are as accurate as possible.

    input: CONTACT US COMPLETE MACHINE GLOBAL
    CONVERSION MACHINES SALES TEAM MARKETING
    TEAM SERVICE TEAM + 91 958 215 2344 + 91 874 482 8924 + 91 888 291 3467
     Email : globalconversionmachines@gmail.com
     Follow us on @ globalcmachines @
     globalconversionmachines Global Conversion Machines
    output: {company_details_format}

    input: {context}
    output:
    """

    fix_json_prompt = f"""Fix the error/malformation
    in the following JSON and ensure that you only return a valid JSON.

    Error: {error}

    input: {malformed_json}
    output: {fixed_json}

    input: {context}
    output:
    """

    tags_and_label_prompt = f"""Suggest some tags and
     a category for the given product name and
    description and convert it into JSON format.
    Ensure that the suggestions are based solely on the content of
    the text and are as accurate as possible.

    input: Product Name: Non Woven Bag Making Machine
    Product Description: 07 NON WOVEN BAG MAKING MACHINE Technical Speciﬁcation
    Fabric Paper Tube Diameter: 2.75 -3 Inches
    Max Speed: 20 -120 Bags /min Bag Width: 3.9-32
    Inches Bag Height: 7.75-24mm Bottom Insert Size: 1.20-3.25 Inches
    Side Folding Size: 1.20-3.25 Inches
    Bag Thickness: 30-120g Power Supplier: 220v/380v Power: 12kw 15kw
    Overall Dimension (L*w*h): 7600*1900*2100mm Weight: 2200 Kg Air
    Compressor: 0.6-1.0 Mpa Unwinding Method: Magnetic Power Tension Control
     Unwinding Diameter: 1000 Mm Max.width Of
      Unwinding: 1300 Mm Correction Device: Photoelectric
     Epc System An Synchronous Rectiﬁcation Motor 110w PRICE PRICE: ` 15,95,000
    output: {non_woven_bag}

    input: Product Name: Toilet Roll Machine
    Product Description: 04 TOILET ROLL MACHINE PRODUCT PRICE PRODUCTION TYPE
     1 4500 Rolls / 8 Hours Toilet Roll ` 4,75,000
     TYPE 2 9000 Rolls / 8 Hours Toilet Roll,
     ` 5,25,000 Kitchen Rolls ,
      Non Woven Cleaning Rolls,
      Hospital Bed Tissue Rolls.
      TYPE 3 17,000 Rolls /
      8 Hours Toilet Roll,
      `11,50,000 Kitchen Rolls,
      Non Woven Cleaning Rolls,
      Hospital Bed Tissue Rolls.
      TYPE 4 Any Customized Production Capacity
    output: {toilet_roll_machine}

    input: Product Name: {product_name}
    Product Description: {context}
    output:
    """

    fix_faq_json_prompt = f"""Fix the error/malformation in the following
    JSON and ensure that you only return a valid JSON.

    Error: {error}

    input: {malformed_faq}
    output: {fixed_faq}

    input: {context}
    output:
    """

    if task == "faq":
        return faq_prompt
    elif task == "specs":
        return product_specs_prompt
    elif task == "check_specs":
        return check_specs_prompt
    elif task == "company_details":
        return company_details_prompt
    elif task == "image_tags_and_labels":
        return tags_and_label_prompt
    elif task == "fix_json":
        return fix_json_prompt
    elif task == "fix_faq_json":
        return fix_faq_json_prompt
    else:
        return check_faq_prompt


def fix_json(error, context, project):
    try:
        fix_json_prompt = get_prompt(context, "fix_json", error)
        fix_json_response = get_model_response(fix_json_prompt, project)
        if not fix_json_response.is_blocked:
            response = \
                ast.literal_eval(fix_json_response.
                                 text.strip().replace('null', 'None'))
            print("[INFO]: JSON fixed successfully!")
        else:
            print("[WARNING]: Fix JSON Response Blocked by LLM.")
            response = get_blocked_response_template()
            response["response_error"]["safety_attributes"] =\
                fix_json_response.safety_attributes
            return response

        return response

    except SyntaxError as e:
        print(f"[ERROR]: SyntaxError during fixing JSON. The LLM may have"
              f" again returned a malformed JSON! \n{e}\n")
        print(fix_json_response.text.strip())
        response = get_blocked_response_template()
        response["response_error"]["is_blocked"] = False
        response["response_error"][
            "message"] = f"""The LLM repeatedly returned
            malformed JSON's!
            \n{fix_json_response.text.strip().
        replace('null', 'None')}"""
        return response

    except Exception as e:
        print(f"[ERROR]: Unknown error during fixing JSON. \n{e}\n")
        print(fix_json_response.text.strip())
        response = get_blocked_response_template()
        response["response_error"]["is_blocked"] = False
        response["response_error"]["message"] = \
            f"""{fix_json_response.text.strip().replace('null', 'None')}"""
        return response


def generate_tags_and_labels(context, products, project):
    try:
        tags_and_labels = {}
        for product in products:
            tags_and_labels_prompt = get_prompt(context,
                                                "image_tags_and_labels",
                                                product_name=product)
            tags_and_labels_response = \
                get_model_response(tags_and_labels_prompt,
                                   project)
            if not tags_and_labels_response.is_blocked:
                response = ast.literal_eval(tags_and_labels_response.
                                            text.strip())
                tags_and_labels[product] = response
            else:
                print("Tags and Label Generation Response Blocked by LLM.")
                response = get_blocked_response_template()
                response["response_error"]["safety_attributes"] =\
                    tags_and_labels_response.safety_attributes
                return response
            return tags_and_labels

    except SyntaxError as e:
        print(
            f"[ERROR]: SyntaxError during Tags "
            f"and Label generation. "
            f"The LLM may have returned a malformed JSON! \n{e}")
        print(tags_and_labels_response.text.strip())
        return {}

    except Exception as e:
        print(f"[ERROR]: Unknown error "
              f"during Tags and Label generation. \n{e}")
        print(tags_and_labels_response.text.strip())
        return {}


def generate_isqs(context, project):
    try:
        product_specs_prompt = get_prompt(context, "specs")
        product_isqs = get_model_response(product_specs_prompt, project)
        if not product_isqs.is_blocked:
            isq_response = \
                ast.literal_eval(product_isqs.text.
                                 strip().replace('null', "None"))
        else:
            print(f"[WARNING]: ISQ Generation Response "
                  f"blocked by LLM: {product_isqs.safety_attributes}")
            isq_response = get_blocked_response_template()
            isq_response["response_error"]["safety_attributes"] = \
                product_isqs.safety_attributes
            return isq_response

        return isq_response

    except SyntaxError as e:
        print(f"[ERROR]: SyntaxError during ISQ generation. "
              f"The LLM may have returned a malformed JSON! \n{e}\n")
        print(product_isqs.text.strip())
        isq_response = fix_json(e, product_isqs.text.strip())
        return isq_response

    except Exception as e:
        print(f"[ERROR]: Unknown error during ISQ generation. \n{e}\n")
        print(product_isqs.text.strip())
        isq_response = get_blocked_response_template()
        isq_response["response_error"]["is_blocked"] = False
        isq_response["response_error"]["message"] = \
            f"""{product_isqs.text.strip().replace('null', 'None')}"""
        return isq_response


def generate_faqs(context, project):
    try:
        get_faq_prompt = get_prompt(context, "faq")
        faq_response = get_model_response(get_faq_prompt, project)
        if not faq_response.is_blocked:
            response = \
                ast.literal_eval(faq_response.
                                 text.strip().
                                 replace('null', 'None'))
        else:
            print(f"[WARNING]: FAQ Generation "
                  f"Response Blocked by LLM. {faq_response.safety_attributes}")
            response = get_blocked_response_template()
            response["response_error"]["safety_attributes"] =\
                faq_response.safety_attributes
            return response

        return response

    except SyntaxError as e:
        print(f"[ERROR]: SyntaxError during FAQ generation."
              f" The LLM may have returned a malformed JSON! \n{e}\n")
        print(faq_response.text.strip())
        response = fix_faq_json(e, faq_response.text.strip())
        return response

    except Exception as e:
        print(f"[ERROR]: Unknown error during FAQ generation. \n{e}\n")
        print(faq_response.text.strip())
        response = get_failed_faq_template()
        response["catalogue_faqs"][0]["response_error"] = f"{e}"
        response["catalogue_faqs"][0]["llm_response"] = \
            f"{faq_response.text.strip().replace('null', 'None')}"
        return response


def generate_company_details(company_text, project):
    try:
        response = {}
        company_details_prompt = get_prompt(company_text, "company_details")
        company_details_response = \
            get_model_response(company_details_prompt, project)
        if not company_details_response.is_blocked:
            response = \
                ast.literal_eval(company_details_response.
                                 text.strip().
                                 replace('null', 'None'))
            print("[INFO]: Company Details Extraction Completed")
        else:
            print(
                f"[WARNING]: Company Details Extraction  "
                f"Response blocked by LLM. "
                f"{company_details_response.safety_attributes}")
            response = get_blocked_response_template()
            response["response_error"]["safety_attributes"] = \
                company_details_response.safety_attributes
            return response

        return response

    except SyntaxError as e:
        print(
            f"[ERROR]: SyntaxError during company"
            f" details extraction. The LLM"
            f" may have returned a malformed JSON! \n{e}\n")
        print(company_details_response.text.strip())
        return {}

    except Exception as e:
        print(f"[ERROR]: Unknown error during "
              f"company details extraction. \n{e}\n")
        print(company_details_response.text.strip())
        return {}


def fix_faq_json(error, context):
    try:
        fix_json_prompt = get_prompt(context, "fix_faq_json", error)
        fix_json_response = get_model_response(fix_json_prompt)
        if not fix_json_response.is_blocked:
            response = \
                ast.literal_eval(fix_json_response.
                                 text.strip().replace('null', 'None'))
            print("[INFO]: JSON fixed successfully!")
        else:
            print("[WARNING]: Fix JSON Response Blocked by LLM.")
            response = get_blocked_response_template()
            response["response_error"]["safety_attributes"] = \
                fix_json_response.safety_attributes
            return response

        return response

    except SyntaxError as e:
        print(f"[ERROR]: SyntaxError during fixing FAQ JSON. "
              f"The LLM may have again returned a malformed JSON! \n{e}\n")
        print(fix_json_response.text.strip())
        response = get_failed_faq_template()
        response["catalogue_faqs"][0]["response_error"] = f"{e}"
        response["catalogue_faqs"][0]["llm_response"] = \
            f"{fix_json_response.text.strip().replace('null', 'None')}"
        return response

    except Exception as e:
        print(f"[ERROR]: Unknown error during fixing FAQ JSON. \n{e}\n")
        print(fix_json_response.text.strip())
        response = get_failed_faq_template()
        response["catalogue_faqs"][0]["response_error"] = f"{e}"
        response["catalogue_faqs"][0]["llm_response"] = \
            f"{fix_json_response.text.strip().replace('null', 'None')}"
        return response


def vertex_ai_llm(prompt):
    try:
        parameters = {
            "candidate_count": 1,
            "max_output_tokens": 1024,
            "temperature": 0,
            "top_p": 0.95,
            "top_k": 40
        }
        model = TextGenerationModel.from_pretrained("text-bison")
        response = model.predict(prompt, **parameters)
        return response.text
    except Exception:
        print(f"[ERROR]: Vertex AI LLM API failed -"
              f" {str(traceback.format_exc())}")
        return ''


def visual_question(image, question):
    from vertexai.vision_models import ImageTextModel, Image
    try:
        model = ImageTextModel.from_pretrained("imagetext@001")
        source_image = Image(image)
        answers = model.ask_question(
            image=source_image,
            question=question,
            # Optional:
            number_of_results=3,
        )
        return answers
    except Exception:
        print(f"[ERROR]: Vertex AI VQA "
              f"API failed - {str(traceback.format_exc())}")
        return ['', '', '']


def image_caption(image):
    from vertexai.vision_models import ImageTextModel, Image
    try:
        model = ImageTextModel.from_pretrained("imagetext@001")
        source_image = Image(image)
        captions = model.get_captions(
            image=source_image,
            # Optional:
            number_of_results=3,
            language="en",
        )
        return captions
    except Exception:
        print(f"[ERROR]: Vertex AI Image caption API failed "
              f"- {str(traceback.format_exc())}")
        return ['', '', '']


def get_options(products, product_descriptions=False):
    options = ""
    for product_no, product in enumerate(products):
        product = product.replace("'", "")
        product = product.replace('"', "")
        product = product.replace("\n", "")
        # product = product.replace("\n","")
        # if product not in products_image_map:
        #     products_image_map[product] = []
        options = options + f"{str(product_no + 1)}. {product}\n"
    return options


def product_description_from_text_prompt(text, products):
    options = get_options(products)
    prompt = f"""
This is the extracted text from pdf page.
As it is extracted using OCR, the order
of the words and spellings might not be completely correct.\
you need to provide short product caption
based on the extracted text in json format

Example Extracted Text
Prodcuct A is a  bench .
 It is of white color.
 I am having a good day.
  I need a toilet roll making machine like product B.

Example Input products:
1. Product A
2. Product B

Example Output format:
```
json
{str({"Product A": "it is a white colored bench",
      "Product B": "It is a machine which is used to make toilet rolls."})}
```


Extarcted Text:
```
{text.replace("'", "").replace('"', "")}
```

Input products:
{options}
"""
    return prompt


def product_tags_from_text_prompt(text, products):
    options = get_options(products)
    prompt = f"""
This is the extracted text from pdf page. As it is extracted using OCR,
the order of the words and spellings might not be completely correct.\
you need to provide 3 tags for each of the products based
on the extracted text in json format

Example Extracted Text
Toilet roll making machine can make toilet rolls easily. Its weight is 2kg.
Contly medicine tablets can cure liver diseases. It has no side effects.

Example Input products:
1. Toilet Roll Machine
2. Contly

Example Output format:
```
json
{str({"Toilet Roll Machine": ["machine", "industrial machine", "tool"],
      "Contly": ["capsule", "medicine", "tablet"]})}
```


Extarcted Text:
```
{text.replace("'", "").replace('"', "")}
```

Input products:
{options}
"""
    return prompt


def product_category_from_text_prompt(text, products):
    options = get_options(products)
    prompt = f"""
This is the extracted text from pdf page.
As it is extracted using OCR,
the order of the words and spellings might not be completely correct.
you need to provide product category
for each of the products based on
the extracted text in json format

Example Extracted Text
Toilet roll making machine can make toilet rolls easily.
It's weight is 2kg.
 Contly medicine tablets can cure liver diseases. It has no side effects.

Example Input products:
1. Toilet Roll Machine
2. Contly

Example Output format:
```
json
{str({"Toilet Roll Machine": "toilet roll making machine",
      "Contly": "liver medicine"})}
```
```


Extarcted Text:
```
{text.replace("'", "").replace('"', "")}
```

Input products:
{options}
"""
    return prompt


def map_product_and_image(images, products, product_description):
    example_json = {"Product_A": "Image 3",
                    "Product_B": "Image 7",
                    "Product_C": "",
                    "Product_D": "Image 2"}
    images_str = ""
    for image_no, image in enumerate(images, start=1):
        image_name = f"Image {str(image_no)}\n"
        caption1 = image["caption1"].replace('"', '').replace("'", "")
        caption2 = image["caption2"].replace('"', '').replace("'", "")
        images_str = images_str + f"{image_name}\nMain Caption -" \
                                  f" reliable and correct:" \
                                  f"\n{caption1}\n\nSpecific Caption " \
                                  f"Guesses which can be " \
                                  f"incorrect:\n{caption2}\n\n"

    products_str = get_options(products)

    product_description_str = ""
    for product_no, product in enumerate(products, start=1):
        if product in product_description:
            product_desc = product_description[product]
            product = product.replace("'", "")
            product = product.replace('"', "")
            product = product.replace("\n", "")
            product_description_str = \
                product_description_str + f"{product}: {str(product_desc)}\n"

    prompt = f"""
You need to map products with images.

For images we have generated 2 types of captions using different methods.


Main caption of image is generic but it is accurate.
Specific caption guesses of image might
be very specific but can be sometimes wrong.
Specific caption guesses contain 3 values,
with 1st one has higher chances of being correct
and 3rd one has comparatively lower chances of being correct.


Very Important points to remember:
1. A product can only be mapped to maximum one image only.
2. An image can only be mapped to maximum one product only.
3. There is also possiblity that there will no image for a product.
4. There is also possiblity that an image is not relevant to any product.

Output should be in json format with product as key
and mapped image as value. If no image can be
mapped for a product, then simply keep its value as empty.

Output format:
```
json
{example_json}
```

Products are as follows:

{products_str}

To better understand products, we also have mapped
tags for some of the products, might not be there for all products.
Compare the main caption with product
tags for more acccurate product image mapping.
Check product tags properly, so that
you dont confuse similar name object with actual products.
example: image of toilet rolls are not
to be confused or mapped with toilet roll making machine
Here are product tags:
{product_description_str}


Images are as follows:

{images_str}


Output:
"""
    return prompt


def llm_json_to_dict(llm_json_text):
    try:
        start = llm_json_text.rfind('{')
        end = llm_json_text.rfind('}')
        answers = llm_json_text[start:end + 1]
        answer_dict = json.loads(answers)
        return answer_dict
    except Exception:
        start = llm_json_text.rfind('{')
        end = llm_json_text.rfind('}')
        answers = llm_json_text[start:end + 1].replace("'", '"')
        answer_dict = json.loads(answers)
        return answer_dict


def get_specific_caption(pdf_json):
    try:
        pdf_gcs_uri = pdf_json["file_url"]
        pdf_gcs_path = pdf_gcs_uri.replace("gs://", "")
        input_gcs_bucket = pdf_gcs_path.split("/")[0]
        filename = pdf_gcs_path.replace(f"{input_gcs_bucket}/", "")
        bucket_object = storage.Client().bucket(input_gcs_bucket)
        blob = bucket_object.blob(filename)
        zoom = 1
        mat = fitz.Matrix(zoom, zoom)
        k = 0
        all_done = False
        max_images = 0
        while not all_done:
            # print(max_images,k)
            pdf_file = fitz.open("pdf", blob.download_as_bytes())
            for page_index, page in enumerate(pdf_file):
                images_info = pdf_json["pages"][page_index]["images"]
                no_of_images = len(images_info)
                if no_of_images > max_images:
                    max_images = no_of_images
                if no_of_images > k:
                    images_info_left = images_info[k:]
                    for i, image_info in \
                            enumerate(images_info_left, start=k + 1):
                        bbox = image_info["bbox"]
                        # width = bbox[2] - bbox[0]
                        # height = bbox[3] - bbox[1]
                        # print(width,height)
                        page.draw_rect([bbox[0] - 2,
                                        bbox[1] - 2,
                                        bbox[2] + 2,
                                        bbox[3] + 2],
                                       color=(1, 0, 0), width=3)
                        pix = page.get_pixmap(matrix=mat)
                        pix.save("img.png")
                        with open("img.png", "rb") as image:
                            img = image.read()
                        # display(Img(img))
                        question = "What is there in the " \
                                   "image which is highlighted " \
                                   "by a red bounding box?"
                        captions = visual_question(img, question)
                        # print(captions)
                        temp = pdf_json["pages"][page_index]
                        temp["images"][k]["specific_captions"] \
                            = captions
                        break
            k = k + 1
            # print(max_images,k)
            if k >= max_images:
                all_done = True
    except Exception:
        print(f"[ERROR]: Specific caption "
              f"generation failed - {str(traceback.format_exc())}")
    return pdf_json


def parse_prod_name(products, product_description):
    product_description_int = {}
    for product in product_description:
        x = re.sub(r'\W+', '', product)
        x = x.lower()
        product_description_int[x] = product_description[product]
    product_description_final = {}
    for product in products:
        x = re.sub(r'\W+', '', product)
        x = x.lower()
        if x in product_description_int:
            product_description_final[product] = product_description_int[x]
    return product_description_final


def generate_tags_json(context, products):
    product_tags_prompt = product_tags_from_text_prompt(context, products)
    # print(product_tags_prompt)
    product_tags = vertex_ai_llm(product_tags_prompt)
    product_tags = llm_json_to_dict(product_tags)
    product_tags = parse_prod_name(products, product_tags)
    return product_tags


def generate_category_json(context, products):
    product_category_prompt = \
        product_category_from_text_prompt(context, products)
    # print(product_category_prompt)
    product_category = vertex_ai_llm(product_category_prompt)
    product_category = llm_json_to_dict(product_category)
    product_category = parse_prod_name(products, product_category)
    return product_category


def generate_images_json(page, products, product_tags, bucket_name):
    products_image_map = {}
    # product_descriptions = {}
    images = page["images"]
    # text = page["texts"]["full_text"]
    if len(products) > 0:
        images_captions = []
        for image_no, image in enumerate(images):
            url = image['image_url']
            # print(url)
            filename = url.replace(f"gs://{bucket_name}/", "")
            # print(filename)
            bucket = storage.Client().bucket(bucket_name)
            blob = bucket.get_blob(filename)
            img = blob.download_as_bytes()
            captions = image_caption(img)
            images[image_no]["captions"] = captions
            # display(Img(img))
            # print(captions)
            try:
                specific_captions = image["specific_captions"]
            except Exception as err:
                print(f"[ERROR]: No specific caption generated - {err}")
                specific_captions = ['', '', '']
            try:
                caption1 = captions[0]
            except Exception as err:
                print(f"[ERROR]: No generic caption generated - {err}")
                caption1 = '\n'
            images_captions.append({"image": image,
                                    "caption1": caption1,
                                    "caption2": str(specific_captions)})
        prompt = map_product_and_image(images_captions, products, product_tags)
        # print(prompt)
        response = vertex_ai_llm(prompt)
        # print(response)
        products_image_map = llm_json_to_dict(response)
        # print(products_image_map)
    product_images = {}
    for product in products_image_map:
        # print(product)
        try:
            # image_no = int(re.sub("\D", "", products_image_map[product]))
            image_no = int(products_image_map[product])
            image = images[image_no - 1]
            generic_caption = image["captions"]
            specific_caption = image["specific_captions"]
            url = image['image_url']
            filename = url.replace(f"gs://{bucket_name}/", "")
            blob = bucket.get_blob(filename)
            img = blob.download_as_bytes()
            # display(Img(img))
            product_images[product] = {"image_url": url,
                                       "generic_caption": generic_caption,
                                       "specific_caption": specific_caption}
        except Exception:
            product_images[product] = "No image found"
            # print("No image found for this product")
        # print("\n\n")
    return product_images
