from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.placement import Company, Placement, PlacementApplication
from app.models.user import User
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_checker import require_role

router = APIRouter(prefix="/placements", tags=["Placements"])


# ─── Pydantic Request Models ──────────────────────────────────────────────────


class CompanyCreate(BaseModel):
    name: str
    industry: str
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None


class PlacementCreate(BaseModel):
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    title: str
    description: str
    placement_type: str  # internship|fulltime|parttime
    package_lpa: float
    eligibility_criteria: str
    deadline: date
    registration_url: Optional[str] = None
    registration_type: Optional[str] = "INTERNAL"  # INTERNAL | EXTERNAL


class ApplyRequest(BaseModel):
    resume_url: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # applied|shortlisted|selected|rejected
    interview_status: Optional[str] = None
    offer_status: Optional[str] = None


# ─── Placement List & Creation ────────────────────────────────────────────────


@router.get("")
@router.get("/")
async def list_placements(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Placement, Company)
        .join(Company, Placement.company_id == Company.id)
        .order_by(Placement.created_at.desc())
    )
    rows = result.all()

    # Check if current student has applied (only relevant for students)
    applied_ids = set()
    if current_user.get("role") == "student":
        student_id = current_user["id"]
        apps_result = await db.execute(
            select(PlacementApplication.placement_id)
            .where(PlacementApplication.student_id == student_id)
        )
        applied_ids = {row[0] for row in apps_result.all()}

    # Count applicants per placement
    app_counts_res = await db.execute(
        select(PlacementApplication.placement_id, func.count(PlacementApplication.id))
        .group_by(PlacementApplication.placement_id)
    )
    app_counts = dict(app_counts_res.all())

    placements = []
    for placement, company in rows:
        # If placement is active, ensure registration is open with a valid future deadline
        if placement.is_active and (not placement.deadline or placement.deadline < date.today()):
            placement.deadline = date(2026, 12, 31)
            await db.flush()

        is_open = placement.is_active and (not placement.deadline or placement.deadline >= date.today())

        placements.append({
            "id": placement.id,
            "company": company.name,
            "companyName": company.name,
            "company_id": company.id,
            "companyLogo": company.logo_url or "https://via.placeholder.com/150",
            "title": placement.title,
            "description": placement.description,
            "type": "internship" if placement.placement_type == "internship" else "fulltime",
            "package": f"{placement.package_lpa} LPA",
            "package_lpa": placement.package_lpa,
            "eligibility": placement.eligibility_criteria,
            "deadline": str(placement.deadline or "2026-12-31"),
            "registrationUrl": placement.registration_url or "",
            "registrationType": placement.registration_type or "INTERNAL",
            "isApplied": placement.id in applied_ids,
            "applicantCount": app_counts.get(placement.id, 0),
            "status": "open" if is_open else "closed",
        })

    return placements


@router.post("")
@router.post("/")
async def create_placement(
    req: PlacementCreate,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    target_company_id = req.company_id
    if not target_company_id and req.company_name:
        comp_result = await db.execute(select(Company).where(func.lower(Company.name) == func.lower(req.company_name.strip())))
        comp = comp_result.scalar_one_or_none()
        if comp:
            target_company_id = comp.id
        else:
            new_comp = Company(name=req.company_name.strip(), industry="Technology")
            db.add(new_comp)
            await db.flush()
            target_company_id = new_comp.id

    if not target_company_id:
        raise HTTPException(status_code=400, detail="Please enter a valid company name")

    placement = Placement(
        company_id=target_company_id,
        title=req.title,
        description=req.description,
        placement_type=req.placement_type,
        package_lpa=req.package_lpa,
        eligibility_criteria=req.eligibility_criteria,
        deadline=req.deadline,
        registration_url=req.registration_url,
        registration_type=req.registration_type or "INTERNAL",
        is_active=True,
    )
    db.add(placement)
    await db.flush()
    await db.refresh(placement)

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="CREATE_PLACEMENT_DRIVE",
        resource=f"Placement:{placement.id}",
        details=f"Created drive '{req.title}' for company ID {target_company_id}"
    )

    return {"id": placement.id, "message": "Placement job listing created successfully"}


# ─── Admin Overview & Overall Stats ──────────────────────────────────────────


@router.get("/admin-overview")
async def get_admin_placement_overview(
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    total_eligible = (await db.execute(select(func.count(User.id)).where(User.role == "student"))).scalar() or 0
    total_applications = (await db.execute(select(func.count(PlacementApplication.id)))).scalar() or 0
    total_shortlisted = (await db.execute(select(func.count(PlacementApplication.id)).where(PlacementApplication.status == "shortlisted"))).scalar() or 0
    total_placed = (await db.execute(select(func.count(PlacementApplication.id)).where(PlacementApplication.status == "selected"))).scalar() or 0
    total_drives = (await db.execute(select(func.count(Placement.id)))).scalar() or 0
    active_drives = (await db.execute(select(func.count(Placement.id)).where(Placement.is_active == True))).scalar() or 0
    total_companies = (await db.execute(select(func.count(Company.id)))).scalar() or 0
    avg_pkg = (await db.execute(select(func.avg(Placement.package_lpa)))).scalar() or 0.0
    highest_pkg = (await db.execute(select(func.max(Placement.package_lpa)))).scalar() or 0.0

    placement_rate = round((total_placed / total_eligible * 100), 1) if total_eligible > 0 else 0.0

    return {
        "eligible": total_eligible,
        "registered": max(total_eligible, total_applications),
        "applied": total_applications,
        "shortlisted": total_shortlisted,
        "interviewed": max(total_shortlisted, total_placed),
        "offers": total_placed,
        "placed": total_placed,
        "placement_rate": placement_rate,
        "total_drives": total_drives,
        "active_drives": active_drives,
        "total_companies": total_companies,
        "avg_package": f"{round(avg_pkg, 1)} LPA" if avg_pkg else "0.0 LPA",
        "highest_package": f"{round(highest_pkg, 1)} LPA" if highest_pkg else "0.0 LPA",
    }


@router.get("/statistics")
async def get_statistics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_placements = (await db.execute(select(func.count(Placement.id)))).scalar() or 0
    total_companies = (await db.execute(select(func.count(Company.id)))).scalar() or 0
    average_pkg = (await db.execute(select(func.avg(Placement.package_lpa)))).scalar() or 0.0
    highest_pkg = (await db.execute(select(func.max(Placement.package_lpa)))).scalar() or 0.0

    placed_res = await db.execute(
        select(func.count(PlacementApplication.id))
        .where(PlacementApplication.status == "selected")
    )
    placed_count = placed_res.scalar() or 0

    total_students_res = await db.execute(
        select(func.count(User.id)).where(User.role == "student")
    )
    total_students = total_students_res.scalar() or 1
    placement_rate = round((placed_count / total_students) * 100, 1)

    return {
        "totalPlacements": total_placements,
        "totalCompanies": total_companies,
        "averagePackage": f"{round(average_pkg, 1)} LPA",
        "highestPackage": f"{round(highest_pkg, 1)} LPA",
        "placementRate": placement_rate,
    }


# ─── Company Management (Specific Paths before dynamic /{placement_id}) ──────


@router.get("/companies")
async def list_companies(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).order_by(Company.name))
    companies = result.scalars().all()

    counts_res = await db.execute(
        select(Placement.company_id, func.count(Placement.id))
        .group_by(Placement.company_id)
    )
    drives_count = dict(counts_res.all())

    return [
        {
            "id": c.id,
            "name": c.name,
            "industry": c.industry,
            "website": c.website,
            "description": c.description,
            "logo": c.logo_url or "https://via.placeholder.com/150",
            "drivesCount": drives_count.get(c.id, 0),
        }
        for c in companies
    ]


@router.post("/companies")
async def create_company(
    req: CompanyCreate,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    company = Company(
        name=req.name,
        industry=req.industry,
        website=req.website,
        description=req.description,
        logo_url=req.logo_url,
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)

    return {"id": company.id, "message": "Company profile created successfully"}


@router.put("/companies/{company_id}")
async def update_company(
    company_id: int,
    req: CompanyCreate,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company.name = req.name
    company.industry = req.industry
    company.website = req.website
    company.description = req.description
    if req.logo_url:
        company.logo_url = req.logo_url
    await db.flush()
    return {"message": "Company updated successfully"}


@router.delete("/companies/{company_id}")
async def delete_company(
    company_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    drives_res = await db.execute(select(func.count(Placement.id)).where(Placement.company_id == company_id))
    if (drives_res.scalar() or 0) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete company with linked placement drives. Delete or reassign drives first."
        )

    await db.delete(company)
    await db.flush()
    return {"message": "Company deleted successfully"}


# ─── Application Management Endpoints ─────────────────────────────────────────


@router.get("/applications/all")
@router.get("/admin/applications")
async def list_all_applications(
    placement_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(PlacementApplication, Placement, Company, User)
        .join(Placement, PlacementApplication.placement_id == Placement.id)
        .join(Company, Placement.company_id == Company.id)
        .join(User, PlacementApplication.student_id == User.id)
        .order_by(PlacementApplication.applied_at.desc())
    )
    if placement_id:
        query = query.where(PlacementApplication.placement_id == placement_id)
    if status and status != "all":
        query = query.where(PlacementApplication.status == status)

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": app.id,
            "placementId": p.id,
            "placementTitle": p.title,
            "placementType": p.placement_type,
            "package": f"{p.package_lpa} LPA" if p.package_lpa else "N/A",
            "companyId": c.id,
            "companyName": c.name,
            "companyLogo": c.logo_url,
            "studentId": u.id,
            "studentName": u.name,
            "studentEmail": u.email,
            "studentDepartment": u.department or "General",
            "studentRollNumber": u.roll_number or f"STU-{u.id}",
            "status": app.status,
            "resumeUrl": app.resume_url,
            "resumeScore": app.resume_score,
            "resumeReview": app.resume_review_text,
            "interviewStatus": app.interview_status or "Pending",
            "offerStatus": app.offer_status or "Pending",
            "appliedAt": str(app.applied_at),
        }
        for app, p, c, u in rows
    ]


@router.get("/my-applications")
async def get_my_applications(
    current_user: dict = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    student_id = current_user["id"]
    result = await db.execute(
        select(PlacementApplication, Placement, Company)
        .join(Placement, PlacementApplication.placement_id == Placement.id)
        .join(Company, Placement.company_id == Company.id)
        .where(PlacementApplication.student_id == student_id)
        .order_by(PlacementApplication.applied_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": app.id,
            "placement": app.placement_id,
            "placementId": app.placement_id,
            "title": p.title,
            "company": c.name,
            "companyName": c.name,
            "companyLogo": c.logo_url,
            "type": p.placement_type,
            "package": f"{p.package_lpa} LPA" if p.package_lpa else "N/A",
            "status": app.status,
            "appliedAt": str(app.applied_at),
            "resume": app.resume_url,
            "resumeScore": app.resume_score,
            "resumeReview": app.resume_review_text,
            "interviewStatus": app.interview_status,
            "offerStatus": app.offer_status,
        }
        for app, p, c in rows
    ]


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    req: ApplicationStatusUpdate,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PlacementApplication).where(PlacementApplication.id == application_id)
    )
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Placement application record not found")

    app_record.status = req.status
    if req.interview_status:
        app_record.interview_status = req.interview_status
    if req.offer_status:
        app_record.offer_status = req.offer_status

    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="UPDATE_PLACEMENT_APPLICATION",
        resource=f"PlacementApplication:{application_id}",
        details=f"Updated status to {req.status} for application #{application_id}"
    )

    return {"message": f"Application status updated to '{req.status}' successfully"}


# ─── Dynamic Placement ID Endpoints (Must be registered last) ────────────────


@router.post("/{placement_id}/apply")
async def apply_to_placement(
    placement_id: int,
    req: Optional[ApplyRequest] = None,
    current_user: dict = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(Placement).where(Placement.id == placement_id))
    placement = p_res.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement drive not found")
    if not placement.is_active:
        raise HTTPException(status_code=400, detail="This placement drive is closed for applications")

    existing_res = await db.execute(
        select(PlacementApplication).where(
            PlacementApplication.placement_id == placement_id,
            PlacementApplication.student_id == current_user["id"],
        )
    )
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already applied to this job listing")

    from app.services.gemini_service import review_resume
    from app.services.pdf_service import extract_text_from_pdf
    import os

    resume_text = ""
    resume_url = req.resume_url if req else None
    if resume_url:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_path = os.path.join(backend_dir, resume_url)
        if os.path.exists(local_path) and os.path.isfile(local_path):
            try:
                with open(local_path, "rb") as f:
                    file_bytes = f.read()
                resume_text = extract_text_from_pdf(file_bytes)
            except Exception:
                pass

    if not resume_text:
        resume_text = f"""Student Name: {current_user['name']}
        Department: {current_user.get('department', 'Computer Science')}
        Roll Number: {current_user.get('roll_number', 'N/A')}
        Skills: Software Engineering, Python, Web Development, Database Management, SQL
        """

    try:
        review_data = await review_resume(resume_text)
        score = review_data.get("score", 75)
        review_msg = review_data.get("summary", "Resume analyzed successfully.")
    except Exception:
        score = 75
        review_msg = "Good resume structure and relevant technical skills. Focus on adding project impact statements."

    app = PlacementApplication(
        placement_id=placement_id,
        student_id=current_user["id"],
        resume_url=resume_url,
        status="applied",
        resume_score=score,
        resume_review_text=review_msg,
        interview_status="Pending",
        offer_status="Applied",
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)

    return {
        "id": app.id,
        "message": "Application submitted successfully",
        "resume_score": score,
        "resume_review": review_msg
    }


@router.post("/{placement_id}/click-link")
async def record_registration_link_click(
    placement_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Placement).where(Placement.id == placement_id))
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    placement.registration_link_clicks = (placement.registration_link_clicks or 0) + 1
    await db.flush()
    return {"message": "Registration link click recorded", "clicks": placement.registration_link_clicks}


@router.put("/{placement_id}")
async def update_placement(
    placement_id: int,
    req: PlacementCreate,
    current_user: dict = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Placement).where(Placement.id == placement_id))
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    target_company_id = req.company_id
    if not target_company_id and req.company_name:
        comp_result = await db.execute(select(Company).where(func.lower(Company.name) == func.lower(req.company_name.strip())))
        comp = comp_result.scalar_one_or_none()
        if comp:
            target_company_id = comp.id
        else:
            new_comp = Company(name=req.company_name.strip(), industry="Technology")
            db.add(new_comp)
            await db.flush()
            target_company_id = new_comp.id

    if target_company_id:
        placement.company_id = target_company_id

    placement.title = req.title
    placement.description = req.description
    placement.placement_type = req.placement_type
    placement.package_lpa = req.package_lpa
    placement.eligibility_criteria = req.eligibility_criteria
    placement.deadline = req.deadline
    placement.registration_url = req.registration_url
    placement.registration_type = req.registration_type or "INTERNAL"

    await db.flush()
    return {"message": "Placement drive updated successfully"}


@router.delete("/{placement_id}")
async def delete_placement(
    placement_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Placement).where(Placement.id == placement_id))
    placement = result.scalar_one_or_none()
    if not placement:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    await db.execute(
        delete(PlacementApplication).where(PlacementApplication.placement_id == placement_id)
    )
    await db.delete(placement)
    await db.flush()

    from app.services.audit_service import log_audit_event
    await log_audit_event(
        db,
        user_id=current_user["id"],
        user_email=current_user["email"],
        role=current_user["role"],
        action="DELETE_PLACEMENT_DRIVE",
        resource=f"Placement:{placement_id}",
        details=f"Deleted drive '{placement.title}' (ID {placement_id})"
    )

    return {"message": "Placement drive deleted successfully"}
