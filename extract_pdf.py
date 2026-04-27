import PyPDF2

pdf_path = r"d:\UTP\MARZO 2026\SOA\AVANCE 1 - SOA.pdf"
with open(pdf_path, 'rb') as file:
    pdf_reader = PyPDF2.PdfReader(file)
    print(f"Total pages: {len(pdf_reader.pages)}\n")
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        print(f"\n{'='*60}")
        print(f"PAGE {page_num + 1}")
        print(f"{'='*60}")
        text = page.extract_text()
        print(text)
