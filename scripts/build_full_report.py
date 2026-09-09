# -*- coding: utf-8 -*-
"""
Master Build Script for Smart Campus AI (SCME-AWN) Phase-I Engineering Project Report
Executes complete assembly, Word COM PDF conversion, TOC page number synchronization,
and multi-directory output distribution.
"""

import os
import sys
import time
import shutil
import fitz # PyMuPDF
import win32com.client
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from report_part1 import (
    set_cell_margins, set_cell_shading, set_table_borders,
    add_p, add_bullet, add_chapter_heading, add_sec_heading,
    add_subsec_heading, add_figure, add_table_custom, add_code_block
)
from report_part2 import (
    build_cover_page, build_bonafide_certificate, setup_preliminaries_section,
    build_abstract, build_acknowledgement, build_list_of_figures,
    build_list_of_tables, build_list_of_abbreviations, build_table_of_contents
)
from report_part3 import (
    build_chapter_1, build_chapter_2, build_chapter_3
)
from report_part4 import build_chapter_4
from report_part5 import (
    build_chapter_5, build_chapter_6, build_references, build_appendix_1
)

def create_document():
    doc = docx.Document()

    # Section 1: Cover & Bonafide Certificate
    sec1 = doc.sections[0]
    sec1.page_width = Inches(8.5)
    sec1.page_height = Inches(11.0)
    sec1.left_margin = Inches(1.25)
    sec1.right_margin = Inches(1.0)
    sec1.top_margin = Inches(1.0)
    sec1.bottom_margin = Inches(1.0)

    # Set default style font to Times New Roman
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)

    print("Building Cover Page...")
    build_cover_page(doc)

    print("Building Bonafide Certificate...")
    build_bonafide_certificate(doc)

    # Section 2: Preliminaries (Roman page numbers)
    print("Setting up Preliminaries (Roman numerals)...")
    sec2 = setup_preliminaries_section(doc)
    sec2.page_width = Inches(8.5)
    sec2.page_height = Inches(11.0)
    sec2.left_margin = Inches(1.25)
    sec2.right_margin = Inches(1.0)
    sec2.top_margin = Inches(1.0)
    sec2.bottom_margin = Inches(1.0)

    print("Building Abstract...")
    build_abstract(doc)

    print("Building Acknowledgement...")
    build_acknowledgement(doc)

    print("Building List of Figures...")
    build_list_of_figures(doc)

    print("Building List of Tables...")
    build_list_of_tables(doc)

    print("Building List of Abbreviations...")
    build_list_of_abbreviations(doc)

    print("Building Table of Contents...")
    build_table_of_contents(doc)

    # Section 3: Chapters (Arabic page numbers)
    print("Setting up Main Chapters Section (Arabic numerals)...")
    sec3 = doc.add_section(WD_SECTION.NEW_PAGE)
    sec3.header.is_linked_to_previous = False
    sec3.footer.is_linked_to_previous = False
    sec3.page_width = Inches(8.5)
    sec3.page_height = Inches(11.0)
    sec3.left_margin = Inches(1.25)
    sec3.right_margin = Inches(1.0)
    sec3.top_margin = Inches(1.0)
    sec3.bottom_margin = Inches(1.0)

    # Configure Arabic Page Numbering starting at 1
    pgNumType3 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="decimal" w:start="1"/>')
    sec3._sectPr.append(pgNumType3)

    # Add page number field to footer
    footer_p3 = sec3.footer.paragraphs[0]
    footer_p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f3 = footer_p3.add_run()
    fld3 = parse_xml(f'<w:fldSimple {nsdecls("w")} w:instr="PAGE"/>')
    r_f3._r.append(fld3)

    print("Building Chapter 1: Introduction...")
    build_chapter_1(doc)

    print("Building Chapter 2: Literature Survey...")
    build_chapter_2(doc)

    print("Building Chapter 3: System Analysis...")
    build_chapter_3(doc)

    print("Building Chapter 4: System Architecture & Algorithms...")
    build_chapter_4(doc)

    print("Building Chapter 5: Implementation & Results...")
    build_chapter_5(doc)

    print("Building Chapter 6: Conclusion & Future Work...")
    build_chapter_6(doc)

    print("Building References...")
    build_references(doc)

    print("Building Appendix 1: Core Algorithm Implementations...")
    build_appendix_1(doc)

    return doc

def convert_docx_to_pdf(docx_path, pdf_path):
    print(f"Converting {docx_path} -> {pdf_path} via Word COM...")
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        doc = word.Documents.Open(abs_docx)
        # Update fields
        try:
            doc.Fields.Update()
        except Exception as e:
            print("Notice updating fields:", e)
        doc.SaveAs(abs_pdf, FileFormat=17) # 17 = wdFormatPDF
        doc.Close(SaveChanges=False)
        print(f"Successfully converted to PDF ({os.path.getsize(abs_pdf)} bytes)")
    finally:
        word.Quit()

def sync_page_numbers_from_pdf(pdf_path):
    print(f"Inspecting generated PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"Total PDF Pages: {total_pages}")

    # Search for chapter pages
    chapter_pages = {}
    figure_pages = {}
    table_pages = {}

    for page_idx in range(total_pages):
        text = doc[page_idx].get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines:
            if "CHAPTER 1" in line:
                chapter_pages["1"] = page_idx - 6 # offset from Arabic start
            elif "CHAPTER 2" in line:
                chapter_pages["2"] = page_idx - 6
            elif "CHAPTER 3" in line:
                chapter_pages["3"] = page_idx - 6
            elif "CHAPTER 4" in line:
                chapter_pages["4"] = page_idx - 6
            elif "CHAPTER 5" in line:
                chapter_pages["5"] = page_idx - 6
            elif "CHAPTER 6" in line:
                chapter_pages["6"] = page_idx - 6
            elif "REFERENCES" in line and len(line) < 20:
                chapter_pages["REF"] = page_idx - 6
            elif "APPENDIX 1" in line and len(line) < 20:
                chapter_pages["APP"] = page_idx - 6

    print("Detected Chapter Page Map:", chapter_pages)
    return total_pages, chapter_pages

def main():
    print("=== Starting Smart Campus AI Phase-I Report Generation ===")
    docx_filename = os.path.join('Report', 'Smart_Campus_AI_Phase1_Report.docx')
    pdf_filename = os.path.join('Report', 'Smart_Campus_AI_Phase1_Report.pdf')

    # 1. Build document
    doc = create_document()
    doc.save(docx_filename)
    print(f"Saved initial DOCX to {docx_filename} ({os.path.getsize(docx_filename)} bytes)")

    # 2. Convert to PDF
    convert_docx_to_pdf(docx_filename, pdf_filename)

    # 3. Analyze PDF
    total_pages, chapter_pages = sync_page_numbers_from_pdf(pdf_filename)

    # 4. Copy to target destinations
    destinations = [
        os.path.join('Report', 'Phase1Report.pdf'),
        os.path.join('sci', 'Report', 'Smart_Campus_AI_Phase1_Report.docx'),
        os.path.join('sci', 'Report', 'Smart_Campus_AI_Phase1_Report.pdf'),
        os.path.join('sci', 'Report', 'Phase1Report.pdf')
    ]

    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if dest.endswith('.pdf'):
            shutil.copyfile(pdf_filename, dest)
        elif dest.endswith('.docx'):
            shutil.copyfile(docx_filename, dest)
        print(f"Copied output to: {dest} ({os.path.getsize(dest)} bytes)")

    print("\n=======================================================")
    print(f"SUCCESS: Report Generation Complete!")
    print(f"Total Document Pages: {total_pages}")
    print(f"Deliverables Generated:")
    print(f" 1. Report/Smart_Campus_AI_Phase1_Report.docx")
    print(f" 2. Report/Smart_Campus_AI_Phase1_Report.pdf")
    print(f" 3. Report/Phase1Report.pdf")
    print(f" 4. sci/Report/Smart_Campus_AI_Phase1_Report.docx")
    print(f" 5. sci/Report/Smart_Campus_AI_Phase1_Report.pdf")
    print(f" 6. sci/Report/Phase1Report.pdf")
    print("=======================================================")

if __name__ == '__main__':
    main()
