import re
import time
import json
from openpyxl import Workbook
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, ImportHistory, Timetable, TimetableEntry
from app.models.department import Department, Subject, Course
from app.models.academic import Classroom, Section
from app.algorithms.timetable_service import TimetableService
from app.services.auth_service import hash_password
from datetime import datetime

class ImportService:
    TEMPLATE_FIELDS = {
        "department": ["Department Code", "Department Name", "Department Block", "HOD Name", "Total Semesters", "Active Status"],
        "academic_year": ["Academic Year", "Semester", "Start Date", "End Date", "Working Days", "Periods Per Day", "Lunch Start", "Lunch End"],
        "faculty": ["Faculty ID", "Faculty Name", "Email", "Phone", "Department", "Designation", "Subjects Can Teach", "Maximum Weekly Hours", "Employment Status"],
        "student": ["Register Number", "Student Name", "Department", "Semester", "Section", "Gender", "Email", "Phone", "Admission Year"],
        "section": ["Department", "Semester", "Section", "Student Strength", "Permanent Classroom"],
        "subject": ["Subject Code", "Subject Name", "Department", "Semester", "Credits", "Weekly Hours", "Subject Type (Theory/Lab)", "Eligible Faculty IDs"],
        "classroom": ["Room Number", "Block", "Floor", "Capacity", "Room Type (Theory/Lab)", "Smart Classroom (Yes/No)", "Department Block", "Status"],
        "laboratory": ["Lab Name", "Room Number", "Capacity", "Department", "Equipment", "Available Systems", "Status"],
        "faculty_subject": ["Faculty ID", "Subject Code", "Department", "Semester"],
        "working_days": ["Day", "Period Number", "Start Time", "End Time", "Is Break", "Is Lunch"],
        "holiday": ["Date", "Holiday Name", "Holiday Type"],
        "elective": ["Subject Code", "Subject Name", "Semester", "Department", "Eligible Sections"],
        "timetable": ["Department", "Semester", "Section", "Day", "P1", "P2", "P3", "P4"]
    }

    @staticmethod
    def create_excel_template(template_type: str) -> Workbook:
        wb = Workbook()
        
        # Add cell styling aesthetics
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
        thin_border = Border(
            left=Side(style='thin', color='DDDDDD'),
            right=Side(style='thin', color='DDDDDD'),
            top=Side(style='thin', color='DDDDDD'),
            bottom=Side(style='thin', color='DDDDDD')
        )

        if template_type == "all_in_one":
            sheet_configs = {
                "Departments": ["Code", "Department", "HOD", "Blocks"],
                "Classrooms": ["Room", "Block", "Department", "Type", "Direction"],
                "Faculty": ["Employee ID", "Name", "Department", "Role"],
                "Students": ["Register Number", "Name", "Department", "Semester", "Section", "Gender", "Email", "Phone", "Admission Year"],
                "Sections": ["Department", "Semester", "Section"],
                "Subjects": ["Department", "Semester", "Subject Code", "Subject"],
                "Timetable": ["Department", "Semester", "Section", "Day", "P1", "P2", "P3", "P4"]
            }
            
            samples = {
                "Departments": ["CSE", "Computer Science and Engineering", "Dr. Arjun Narayanan", "A"],
                "Classrooms": ["A101", "A", "CSE", "Theory", "NORTH"],
                "Faculty": ["CSE001", "CSE Faculty 1", "CSE", "HOD"],
                "Students": ["UR20CSE001", "Ada Lovelace", "CSE", "5", "A", "Female", "ada@campus.edu", "9988776655", "2023"],
                "Sections": ["CSE", "1", "A"],
                "Subjects": ["CSE", "1", "CSE-MA101", "Engineering Mathematics I"],
                "Timetable": ["CSE", "5", "A", "Monday", "Mathematics", "Programming", "Data Structures", "DBMS"]
            }
            
            # Remove default active sheet
            wb.remove(wb.active)
            
            for sname, headers in sheet_configs.items():
                ws = wb.create_sheet(title=sname)
                ws.append(headers)
                ws.append(samples[sname])
                
                # Style Header
                ws.row_dimensions[1].height = 24
                for cell in ws[1]:
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = header_align
                    cell.border = thin_border
                    
                # Style Sample row
                for cell in ws[2]:
                    cell.border = thin_border
                    cell.alignment = Alignment(horizontal="left", vertical="center")
                    
                # Autofit columns
                for col in ws.columns:
                    max_len = max(len(str(cell.value or '')) for cell in col)
                    col_letter = col[0].column_letter
                    ws.column_dimensions[col_letter].width = max(max_len + 4, 13)
                    
            return wb

        ws = wb.active
        ws.title = "Template"

        # Headers
        headers = ImportService.TEMPLATE_FIELDS.get(template_type, ["Header 1", "Header 2"])
        ws.append(headers)

        # Instructions Sheet
        ws_inst = wb.create_sheet("Instructions")
        ws_inst.append(["Column Name", "Description", "Required?", "Example / Format"])
        
        instructions = {
            "department": [
                ("Department Code", "Unique short code", "Yes", "CSE"),
                ("Department Name", "Full name of department", "Yes", "Computer Science and Engineering"),
                ("Department Block", "Building name or block name", "No", "CS Block"),
                ("HOD Name", "Head of Department name", "No", "Dr. Alan Turing"),
                ("Total Semesters", "Total semesters offered", "No", "8"),
                ("Active Status", "Active or Inactive", "No", "Active")
            ],
            "faculty": [
                ("Faculty ID", "Unique identification code", "Yes", "FAC101"),
                ("Faculty Name", "Full name", "Yes", "Prof. Richard Feynman"),
                ("Email", "Valid email address", "Yes", "feynman@campus.edu"),
                ("Phone", "10-digit mobile number", "No", "9876543210"),
                ("Department", "Department name or code", "Yes", "CSE"),
                ("Designation", "Job title", "No", "Professor"),
                ("Subjects Can Teach", "Comma separated subjects", "No", "Computer Networks, Database Systems"),
                ("Maximum Weekly Hours", "Max teaching hours per week", "No", "16"),
                ("Employment Status", "Fulltime / Parttime / Contract", "No", "Fulltime")
            ],
            "student": [
                ("Register Number", "Unique university registration number", "Yes", "UR20CSE001"),
                ("Student Name", "Full name of student", "Yes", "Ada Lovelace"),
                ("Department", "Department name or code", "Yes", "CSE"),
                ("Semester", "Current semester digit", "Yes", "5"),
                ("Section", "Section alphabet name", "Yes", "A"),
                ("Gender", "Male / Female / Other", "No", "Female"),
                ("Email", "Valid email address", "Yes", "ada@campus.edu"),
                ("Phone", "10-digit mobile number", "No", "9988776655"),
                ("Admission Year", "Year of entry", "Yes", "2023")
            ],
            "classroom": [
                ("Room Number", "Unique identification number of the room", "Yes", "Room 101"),
                ("Block", "Building name or block name", "Yes", "CS Block"),
                ("Floor", "Floor digit (0 for ground)", "Yes", "1"),
                ("Capacity", "Student seat capacity", "Yes", "60"),
                ("Room Type (Theory/Lab)", "THEORY or LAB", "Yes", "THEORY"),
                ("Smart Classroom (Yes/No)", "Has smartboard/projector? Yes or No", "No", "Yes"),
                ("Department Block", "Assigned department block", "No", "CS Block"),
                ("Status", "active / maintenance / inactive", "No", "active")
            ],
            "section": [
                ("Department", "Department name or code", "Yes", "CSE"),
                ("Semester", "Semester digit", "Yes", "1"),
                ("Section", "Section letter", "Yes", "A"),
                ("Student Strength", "Student count limit", "Yes", "60"),
                ("Permanent Classroom", "Room number (auto-assigned if blank)", "No", "Room 101")
            ],
            "subject": [
                ("Subject Code", "Unique course syllabus code", "Yes", "CS302"),
                ("Subject Name", "Full course name", "Yes", "Database Management Systems"),
                ("Department", "Department name or code", "Yes", "CSE"),
                ("Semester", "Semester digit", "Yes", "5"),
                ("Credits", "Credit weight", "Yes", "4"),
                ("Weekly Hours", "Lecture/Practical hours per week", "Yes", "4"),
                ("Subject Type (Theory/Lab)", "Theory or Lab", "Yes", "Theory"),
                ("Eligible Faculty IDs", "Comma-separated eligible faculty IDs", "No", "FAC101, FAC102")
            ]
        }

        inst_data = instructions.get(template_type, [("Field", "Generic Field", "No", "Sample")])
        for row in inst_data:
            ws_inst.append(row)

        # Sample row
        sample_row = {
            "department": ["CSE", "Computer Science and Engineering", "CS Block", "Dr. Alan Turing", "8", "Active"],
            "academic_year": ["2025-26", "1", "2025-06-15", "2025-11-30", "90", "6", "12:00:00", "13:00:00"],
            "faculty": ["FAC101", "Prof. Richard Feynman", "feynman@campus.edu", "9876543210", "CSE", "Professor", "Computer Networks", "16", "Fulltime"],
            "student": ["UR20CSE001", "Ada Lovelace", "CSE", "5", "A", "Female", "ada@campus.edu", "9988776655", "2023"],
            "section": ["CSE", "1", "A", "60", ""],
            "subject": ["CS302", "Database Management Systems", "CSE", "5", "4", "4", "Theory", "FAC101"],
            "classroom": ["Room 101", "CS Block", "1", "60", "THEORY", "Yes", "CS Block", "active"],
            "laboratory": ["Embedded Systems Lab", "Room 205", "30", "ECE", "Microcontrollers", "30", "active"],
            "faculty_subject": ["FAC101", "CS302", "CSE", "5"],
            "working_days": ["Monday", "1", "09:00:00", "10:00:00", "No", "No"],
            "holiday": ["2025-08-15", "Independence Day", "National"],
            "elective": ["CS501", "Advanced Machine Learning", "5", "CSE", "A, B"]
        }
        ws.append(sample_row.get(template_type, []))

        # Style Template Sheet Header
        ws.row_dimensions[1].height = 24
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_align
            cell.border = thin_border

        # Style Instructions Sheet Header
        ws_inst.row_dimensions[1].height = 24
        for cell in ws_inst[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_align
            cell.border = thin_border

        # Style WS inst rows
        for row in ws_inst.iter_rows(min_row=2):
            for cell in row:
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="left", vertical="center")

        # Style WS sample row
        for row in ws.iter_rows(min_row=2, max_row=2):
            for cell in row:
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="left", vertical="center")

        # Auto-fit columns
        for ws_sheet in [ws, ws_inst]:
            for col in ws_sheet.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = col[0].column_letter
                ws_sheet.column_dimensions[col_letter].width = max(max_len + 4, 13)

        # Add data validation rules (e.g. Active Status, Room Type dropdowns)
        if template_type == "classroom":
            dv_type = DataValidation(type="list", formula1='"THEORY,LAB"', allow_blank=True)
            ws.add_data_validation(dv_type)
            dv_type.add("E2:E1000") # Room Type Column
            
            dv_smart = DataValidation(type="list", formula1='"Yes,No"', allow_blank=True)
            ws.add_data_validation(dv_smart)
            dv_smart.add("F2:F1000") # Smart Classroom Column

        elif template_type == "subject":
            dv_subtype = DataValidation(type="list", formula1='"Theory,Lab"', allow_blank=True)
            ws.add_data_validation(dv_subtype)
            dv_subtype.add("G2:G1000") # Subject Type Column

        return wb

    @staticmethod
    async def validate_and_parse_import(db: AsyncSession, file_rows: list, template_type: str) -> dict:
        headers = ImportService.TEMPLATE_FIELDS.get(template_type, [])
        if not file_rows or len(file_rows) < 1:
            return {"error": "Excel sheet is empty"}
        
        file_headers = [str(cell).strip() for cell in file_rows[0]]
        
        # User-specific headers mapping
        header_replacements = {}
        if template_type == "department":
            header_replacements = {
                "Code": "Department Code",
                "Department": "Department Name",
                "HOD": "HOD Name",
                "Blocks": "Department Block"
            }
        elif template_type == "classroom":
            header_replacements = {
                "Room": "Room Number",
                "Block": "Block",
                "Department": "Department Block",
                "Type": "Room Type (Theory/Lab)"
            }
        elif template_type == "faculty":
            header_replacements = {
                "Employee ID": "Faculty ID",
                "Name": "Faculty Name",
                "Department": "Department",
                "Role": "Designation"
            }
        elif template_type == "student":
            header_replacements = {
                "Name": "Student Name"
            }
        elif template_type == "section":
            header_replacements = {
                "Department": "Department",
                "Semester": "Semester",
                "Section": "Section"
            }
        elif template_type == "subject":
            header_replacements = {
                "Department": "Department",
                "Semester": "Semester",
                "Subject Code": "Subject Code",
                "Subject": "Subject Name"
            }
            
        mapped_headers = []
        for fh in file_headers:
            mapped_headers.append(header_replacements.get(fh, fh))
        file_headers = mapped_headers

        # Strictly required headers
        required_headers_map = {
            "department": ["Department Code", "Department Name"],
            "classroom": ["Room Number", "Block"],
            "faculty": ["Faculty ID", "Faculty Name"],
            "student": ["Register Number", "Student Name", "Department", "Semester", "Section"],
            "section": ["Department", "Semester", "Section"],
            "subject": ["Subject Code", "Subject Name", "Department", "Semester"],
            "timetable": ["Department", "Semester", "Section", "Day", "P1", "P2", "P3", "P4"]
        }
        
        required = required_headers_map.get(template_type, headers)
        for rh in required:
            if rh not in file_headers:
                return {"error": f"Missing required column header: '{rh}'"}

        header_map = {h: file_headers.index(h) for h in headers if h in file_headers}
        
        # Default values map for fields not in file_headers
        default_values_map = {
            "department": {
                "Department Block": "",
                "HOD Name": "",
                "Total Semesters": "8",
                "Active Status": "Active"
            },
            "classroom": {
                "Floor": "1",
                "Capacity": "60",
                "Room Type (Theory/Lab)": "THEORY",
                "Smart Classroom (Yes/No)": "No",
                "Department Block": "",
                "Status": "active"
            },
            "faculty": {
                "Email": "",
                "Phone": "",
                "Designation": "Lecturer",
                "Subjects Can Teach": "",
                "Maximum Weekly Hours": "16",
                "Employment Status": "Fulltime"
            },
            "student": {
                "Gender": "Male",
                "Email": "",
                "Phone": "",
                "Admission Year": "2026"
            },
            "section": {
                "Student Strength": "60",
                "Permanent Classroom": ""
            },
            "subject": {
                "Credits": "4",
                "Weekly Hours": "4",
                "Subject Type (Theory/Lab)": "Theory",
                "Eligible Faculty IDs": ""
            },
            "timetable": {}
        }
        
        defaults = default_values_map.get(template_type, {})
        
        valid_records = []
        invalid_records = []
        seen_keys = set()
        
        email_regex = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
        phone_regex = re.compile(r"^\+?\d{10,15}$")

        for idx, row in enumerate(file_rows[1:], start=2):
            if not any(row): 
                continue # Skip completely empty rows
            
            record = {}
            for h in headers:
                if h in header_map:
                    col_idx = header_map[h]
                    val = row[col_idx]
                    record[h] = str(val).strip() if val is not None else ""
                else:
                    record[h] = defaults.get(h, "")

            errors = []
            
            # Check primary key duplications
            if template_type == "department":
                key = record["Department Code"]
                if not key:
                    errors.append("Department Code is required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Department Code in sheet: '{key}'")
                seen_keys.add(key)

            elif template_type == "faculty":
                key = record["Faculty ID"]
                if not key:
                    errors.append("Faculty ID is required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Faculty ID in sheet: '{key}'")
                seen_keys.add(key)
                
                email = record["Email"]
                if email and not email_regex.match(email):
                    errors.append(f"Invalid email format: '{email}'")
                phone = record["Phone"]
                if phone and not phone_regex.match(phone):
                    errors.append(f"Invalid phone number: '{phone}'")

            elif template_type == "student":
                key = record["Register Number"]
                if not key:
                    errors.append("Register Number is required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Register Number in sheet: '{key}'")
                seen_keys.add(key)
                
                email = record["Email"]
                if email and not email_regex.match(email):
                    errors.append(f"Invalid email format: '{email}'")

            elif template_type == "classroom":
                key = record["Room Number"]
                if not key:
                    errors.append("Room Number is required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Room Number in sheet: '{key}'")
                seen_keys.add(key)
                
                capacity = record["Capacity"]
                if capacity and not capacity.isdigit():
                    errors.append(f"Capacity must be an integer: '{capacity}'")

            elif template_type == "section":
                key = (record["Department"], record["Semester"], record["Section"])
                if not all(key):
                    errors.append("Department, Semester, and Section are required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Section record in sheet: '{key}'")
                seen_keys.add(key)

            elif template_type == "subject":
                key = record["Subject Code"]
                if not key:
                    errors.append("Subject Code is required")
                elif key in seen_keys:
                    errors.append(f"Duplicate Subject Code in sheet: '{key}'")
                seen_keys.add(key)

            elif template_type == "timetable":
                key = (record["Department"], record["Semester"], record["Section"], record["Day"])
                if not all(key):
                    errors.append("Department, Semester, Section, and Day are required")
                seen_keys.add(key)

            if "Department" in record and record["Department"]:
                dept_code = record["Department"]
                record["Department"] = dept_code.upper()

            if errors:
                record["row_idx"] = idx
                record["error_message"] = "; ".join(errors)
                invalid_records.append(record)
            else:
                record["row_idx"] = idx
                valid_records.append(record)

        total = len(valid_records) + len(invalid_records)
        quality_score = round((len(valid_records) / total) * 100, 1) if total > 0 else 0.0

        return {
            "total_records": total,
            "valid_count": len(valid_records),
            "invalid_count": len(invalid_records),
            "valid_records": valid_records,
            "invalid_records": invalid_records,
            "quality_score": quality_score,
            "suggestions": [f"Automatically converted department codes to uppercase" for r in valid_records if "Department" in r]
        }

    @staticmethod
    async def execute_import(db: AsyncSession, valid_records: list, template_type: str, user_id: int) -> dict:
        start_time = time.time()
        success_count = 0
        failed_count = 0
        error_logs = []

        for r in valid_records:
            try:
                if template_type == "department":
                    dept_stmt = select(Department).where(Department.code == r["Department Code"].upper())
                    dept_res = await db.execute(dept_stmt)
                    dept = dept_res.scalar_one_or_none()
                    if dept:
                        dept.name = r["Department Name"]
                        dept.department_block = r.get("Department Block") or dept.department_block
                        dept.hod_name = r.get("HOD Name") or dept.hod_name
                        dept.total_semesters = int(r["Total Semesters"]) if r.get("Total Semesters") else dept.total_semesters
                        dept.active = (1 if r.get("Active Status", "Active").lower() == "active" else 0) if r.get("Active Status") else dept.active
                    else:
                        dept = Department(
                            code=r["Department Code"].upper(),
                            name=r["Department Name"],
                            department_block=r.get("Department Block"),
                            hod_name=r.get("HOD Name"),
                            total_semesters=int(r["Total Semesters"]) if r.get("Total Semesters") else 8,
                            active=1 if r.get("Active Status", "Active").lower() == "active" else 0
                        )
                        db.add(dept)
                    await db.flush()
                    success_count += 1

                elif template_type == "classroom":
                    c_stmt = select(Classroom).where(Classroom.room_number == r["Room Number"])
                    c_res = await db.execute(c_stmt)
                    room = c_res.scalar_one_or_none()
                    
                    is_lab = True if r["Room Type (Theory/Lab)"].upper() == "LAB" else False
                    smart_classroom = True if r.get("Smart Classroom (Yes/No)", "No").lower() in ["yes", "y", "true"] else False
                    
                    if room:
                        room.building = r["Block"]
                        room.floor = int(r["Floor"]) if r.get("Floor") else room.floor
                        room.capacity = int(r["Capacity"]) if r.get("Capacity") else room.capacity
                        room.room_type = r["Room Type (Theory/Lab)"].upper()
                        room.is_lab = is_lab
                        room.smart_classroom = smart_classroom
                        room.department_block = r.get("Department Block") or room.department_block
                        room.active = (1 if r.get("Status", "active").lower() == "active" else 0) if r.get("Status") else room.active
                    else:
                        room = Classroom(
                            room_number=r["Room Number"],
                            building=r["Block"],
                            floor=int(r["Floor"]),
                            capacity=int(r["Capacity"]),
                            room_type=r["Room Type (Theory/Lab)"].upper(),
                            is_lab=is_lab,
                            smart_classroom=smart_classroom,
                            department_block=r.get("Department Block"),
                            active=1 if r.get("Status", "active").lower() == "active" else 0
                        )
                        db.add(room)
                    await db.flush()
                    success_count += 1

                elif template_type == "faculty":
                    # Get or create department first
                    dept_code = r["Department"].upper()
                    dept_res = await db.execute(select(Department).where(Department.code == dept_code))
                    dept_obj = dept_res.scalar_one_or_none()
                    if not dept_obj:
                        dept_obj = Department(code=dept_code, name=f"{dept_code} Department")
                        db.add(dept_obj)
                        await db.flush()

                    email = r.get("Email")
                    if not email:
                        email = f"{r['Faculty ID'].lower()}@campus.com"

                    is_hod = r.get("Designation", "").upper() == "HOD"
                    role = "hod" if is_hod else "faculty"

                    # Check unique constraint on employee_id or email
                    f_stmt = select(User).where((User.employee_id == r["Faculty ID"]) | (User.email == email))
                    f_res = await db.execute(f_stmt)
                    faculty_user = f_res.scalar_one_or_none()
                    
                    if faculty_user:
                        faculty_user.name = r["Faculty Name"]
                        faculty_user.email = email
                        faculty_user.phone_number = r.get("Phone") or faculty_user.phone_number
                        faculty_user.role = role
                        faculty_user.department = dept_obj.name
                    else:
                        faculty_user = User(
                            employee_id=r["Faculty ID"],
                            name=r["Faculty Name"],
                            email=email,
                            phone_number=r.get("Phone"),
                            role=role,
                            password=hash_password("faculty123"),
                            department=dept_obj.name,
                            is_first_login=True
                        )
                        db.add(faculty_user)
                    await db.flush()
                    
                    if is_hod:
                        dept_obj.hod_name = r["Faculty Name"]
                        db.add(dept_obj)
                        await db.flush()
                        
                    success_count += 1

                elif template_type == "student":
                    dept_code = r["Department"].upper()
                    dept_res = await db.execute(select(Department).where(Department.code == dept_code))
                    dept_obj = dept_res.scalar_one_or_none()
                    if not dept_obj:
                        dept_obj = Department(code=dept_code, name=f"{dept_code} Department")
                        db.add(dept_obj)
                        await db.flush()

                    email = r.get("Email")
                    if not email:
                        email = f"{r['Register Number'].lower()}@campus.com"

                    s_stmt = select(User).where((User.roll_number == r["Register Number"]) | (User.email == email))
                    s_res = await db.execute(s_stmt)
                    student_user = s_res.scalar_one_or_none()

                    if student_user:
                        student_user.name = r["Student Name"]
                        student_user.email = email
                        student_user.phone_number = r.get("Phone") or student_user.phone_number
                        student_user.department = dept_obj.name
                        student_user.semester = int(r["Semester"])
                        student_user.section = r["Section"]
                    else:
                        student_user = User(
                            roll_number=r["Register Number"],
                            name=r["Student Name"],
                            email=email,
                            phone_number=r.get("Phone"),
                            role="student",
                            password=hash_password("student123"),
                            department=dept_obj.name,
                            semester=int(r["Semester"]),
                            section=r["Section"],
                            is_first_login=True
                        )
                        db.add(student_user)
                    await db.flush()
                    success_count += 1

                elif template_type == "section":
                    dept_code = r["Department"].upper()
                    dept_res = await db.execute(select(Department).where(Department.code == dept_code))
                    dept_obj = dept_res.scalar_one_or_none()
                    if not dept_obj:
                        dept_obj = Department(code=dept_code, name=f"{dept_code} Department")
                        db.add(dept_obj)
                        await db.flush()

                    # Resolve permanent classroom if specified
                    perm_room_id = None
                    perm_room_no = r.get("Permanent Classroom")
                    if perm_room_no:
                        c_res = await db.execute(select(Classroom).where(Classroom.room_number == perm_room_no))
                        c_obj = c_res.scalar_one_or_none()
                        if c_obj:
                            perm_room_id = c_obj.id

                    sec_stmt = select(Section).where(
                        Section.department_id == dept_obj.id,
                        Section.semester == int(r["Semester"]),
                        Section.section_name == r["Section"]
                    )
                    sec_res = await db.execute(sec_stmt)
                    section_obj = sec_res.scalar_one_or_none()

                    if section_obj:
                        section_obj.student_strength = int(r["Student Strength"])
                        if perm_room_id:
                            section_obj.permanent_room_id = perm_room_id
                    else:
                        section_obj = Section(
                            department_id=dept_obj.id,
                            semester=int(r["Semester"]),
                            section_name=r["Section"],
                            student_strength=int(r["Student Strength"]),
                            permanent_room_id=perm_room_id
                        )
                        db.add(section_obj)
                    await db.flush()

                    # Trigger auto assignment if permanent classroom was empty
                    if not perm_room_id and not section_obj.permanent_room_id:
                        room_res = await db.execute(select(Classroom).where(Classroom.active == True))
                        all_rooms = room_res.scalars().all()
                        theory_rooms = [rm for rm in all_rooms if rm.room_type == "THEORY"]
                        if not theory_rooms:
                            theory_rooms = [rm for rm in all_rooms if not rm.is_lab]
                        
                        if theory_rooms:
                            best_room = max(
                                theory_rooms,
                                key=lambda rm: TimetableService.calculate_permanent_room_score(rm, int(r["Student Strength"]), dept_obj.department_block or dept_obj.name)
                            )
                            section_obj.permanent_room_id = best_room.id
                            db.add(section_obj)
                            await db.flush()

                    success_count += 1

                elif template_type == "subject":
                    dept_code = r["Department"].upper()
                    dept_res = await db.execute(select(Department).where(Department.code == dept_code))
                    dept_obj = dept_res.scalar_one_or_none()
                    if not dept_obj:
                        dept_obj = Department(code=dept_code, name=f"{dept_code} Department")
                        db.add(dept_obj)
                        await db.flush()

                    # Subject table maps to courses on the database.
                    # Create or fetch Course
                    course_stmt = select(Course).where(Course.code == r["Subject Code"].upper())
                    course_res = await db.execute(course_stmt)
                    course_obj = course_res.scalar_one_or_none()
                    if not course_obj:
                        course_obj = Course(
                            code=r["Subject Code"].upper(),
                            name=r["Subject Name"],
                            department_id=dept_obj.id,
                            semester=int(r["Semester"]),
                            credits=int(r["Credits"])
                        )
                        db.add(course_obj)
                        await db.flush()
                    else:
                        course_obj.name = r["Subject Name"]
                        course_obj.department_id = dept_obj.id
                        course_obj.semester = int(r["Semester"])
                        course_obj.credits = int(r["Credits"])
                        db.add(course_obj)
                        await db.flush()

                    # Create/Update Subject linked to course
                    subj_stmt = select(Subject).where(Subject.code == r["Subject Code"].upper())
                    subj_res = await db.execute(subj_stmt)
                    subject_obj = subj_res.scalar_one_or_none()

                    if subject_obj:
                        subject_obj.name = r["Subject Name"]
                        subject_obj.course_id = course_obj.id
                        subject_obj.semester = int(r["Semester"])
                    else:
                        subject_obj = Subject(
                            name=r["Subject Name"],
                            code=r["Subject Code"].upper(),
                            course_id=course_obj.id,
                            semester=int(r["Semester"])
                        )
                        db.add(subject_obj)
                    await db.flush()
                    success_count += 1

                elif template_type == "timetable":
                    dept_code = r["Department"].upper()
                    sem = int(r["Semester"])
                    sec = r["Section"]
                    day = r["Day"]

                    # Helper to map semester to year
                    def map_sem_to_year(s: int) -> str:
                        if s in (1, 2): return "I"
                        if s in (3, 4): return "II"
                        if s in (5, 6): return "III"
                        return "IV"

                    year = map_sem_to_year(sem)

                    # Get active Timetable or create one
                    tt_res = await db.execute(
                        select(Timetable).where(
                            Timetable.department == dept_code,
                            Timetable.year == year,
                            Timetable.section == sec,
                            Timetable.is_active == True
                        )
                    )
                    tt_obj = tt_res.scalar_one_or_none()
                    if not tt_obj:
                        tt_obj = Timetable(
                            department=dept_code,
                            year=year,
                            section=sec,
                            is_active=True
                        )
                        db.add(tt_obj)
                        await db.flush()
                        await db.refresh(tt_obj)

                    period_times = {
                        "P1": ("09:00:00", "10:00:00"),
                        "P2": ("10:00:00", "11:00:00"),
                        "P3": ("11:00:00", "12:00:00"),
                        "P4": ("13:00:00", "14:00:00")
                    }

                    for p_col, (st, et) in period_times.items():
                        subj_name = r.get(p_col)
                        if not subj_name or subj_name.strip().upper() in ["", "NONE", "NULL", "TBD"]:
                            continue

                        start_t = datetime.strptime(st, "%H:%M:%S").time()
                        end_t = datetime.strptime(et, "%H:%M:%S").time()

                        # Avoid duplicates
                        entry_res = await db.execute(
                            select(TimetableEntry).where(
                                TimetableEntry.timetable_id == tt_obj.id,
                                TimetableEntry.day == day,
                                TimetableEntry.start_time == start_t
                            )
                        )
                        entry_obj = entry_res.scalar_one_or_none()
                        if not entry_obj:
                            entry_obj = TimetableEntry(
                                timetable_id=tt_obj.id,
                                subject=subj_name.strip(),
                                day=day,
                                start_time=start_t,
                                end_time=end_t,
                                room="TBD",
                                faculty="TBD"
                            )
                            db.add(entry_obj)

                    await db.flush()
                    success_count += 1

            except Exception as e:
                failed_count += 1
                error_logs.append(f"Row {r.get('row_idx')}: {str(e)}")

        await db.commit()
        proc_time = int((time.time() - start_time) * 1000)

        # Write execution history log
        history = ImportHistory(
            filename=f"bulk_{template_type}_{int(time.time())}.xlsx",
            import_type=template_type,
            total_records=len(valid_records),
            successful_imports=success_count,
            failed_imports=failed_count,
            failed_records_log=json.dumps(error_logs) if error_logs else None,
            processing_time_ms=proc_time,
            status="completed" if failed_count == 0 else "partially_completed" if success_count > 0 else "failed",
            uploaded_by=user_id
        )
        db.add(history)
        await db.commit()

        return {
            "success": True,
            "imported_count": success_count,
            "failed_count": failed_count,
            "processing_time_ms": proc_time,
            "errors": error_logs
        }

    @staticmethod
    async def validate_and_parse_all_in_one(db: AsyncSession, wb) -> dict:
        categories = {}
        total_rec = 0
        valid_rec = 0
        invalid_rec = 0
        quality_scores = []
        
        sheet_mappings = {
            "Departments": "department",
            "Classrooms": "classroom",
            "Faculty": "faculty",
            "Students": "student",
            "Sections": "section",
            "Subjects": "subject",
            "Timetable": "timetable"
        }
        
        for sheet_name, key in sheet_mappings.items():
            if sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                rows = []
                for r in ws.iter_rows(values_only=True):
                    rows.append(r)
                
                report = await ImportService.validate_and_parse_import(db, rows, key)
                if "error" not in report:
                    categories[key] = report
                    total_rec += report["total_records"]
                    valid_rec += report["valid_count"]
                    invalid_rec += report["invalid_count"]
                    quality_scores.append(report["quality_score"])
                else:
                    categories[key] = {"error": report["error"], "total_records": 0, "valid_count": 0, "invalid_count": 0, "valid_records": [], "invalid_records": []}
            else:
                categories[key] = {"error": f"Sheet '{sheet_name}' not found in workbook", "total_records": 0, "valid_count": 0, "invalid_count": 0, "valid_records": [], "invalid_records": []}
                
        avg_quality = round(sum(quality_scores) / len(quality_scores), 1) if quality_scores else 0.0
        
        return {
            "is_all_in_one": True,
            "total_records": total_rec,
            "valid_count": valid_rec,
            "invalid_count": invalid_rec,
            "quality_score": avg_quality,
            "categories": categories
        }

    @staticmethod
    async def execute_import_all_in_one(db: AsyncSession, categories_valid_records: dict, user_id: int) -> dict:
        import_order = ["department", "classroom", "faculty", "student", "section", "subject", "timetable"]
        
        total_imported = 0
        total_failed = 0
        details = {}
        
        for key in import_order:
            valid_list = categories_valid_records.get(key, [])
            if valid_list:
                res = await ImportService.execute_import(db, valid_list, key, user_id)
                details[key] = res
                total_imported += res["imported_count"]
                total_failed += res["failed_count"]
                
        return {
            "success": True,
            "imported_count": total_imported,
            "failed_count": total_failed,
            "details": details
        }
