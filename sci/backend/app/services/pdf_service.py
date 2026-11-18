import io
import fitz  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes, filename: str = "") -> str:
    """
    Extracts text from PDF, DOCX, or text document bytes.
    """
    text = ""
    # 1. Try PyMuPDF auto-detection
    try:
        doc = fitz.open(stream=file_bytes)
        for page in doc:
            text += page.get_text()
        doc.close()
        if text.strip():
            return text
    except Exception:
        pass

    # 2. Try python-docx if Word document
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([c.text.strip() for c in row.cells if c.text.strip()])
                if row_text:
                    paragraphs.append(row_text)
        docx_text = "\n".join(paragraphs)
        if docx_text.strip():
            return docx_text
    except Exception:
        pass

    # 3. Try UTF-8 / ASCII text decode
    try:
        decoded = file_bytes.decode("utf-8", errors="ignore")
        if decoded.strip():
            return decoded
    except Exception:
        pass

    return text
