import fitz  # Install with "pip install pymupdf"

doc = fitz.open("./longfian-jay-5w-single-flow-oxygen-concentrator.pdf")
page = doc[0]  # Access the first page (zero-indexed)
pix = page.get_pixmap()  # Render the page as an image
pix.save("output_image.png")  # Save as a PNG image
