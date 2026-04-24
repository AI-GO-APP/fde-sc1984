def execute(ctx):
    # for_picker=True：只回傳有 user_id 的員工（供業務員下拉選單）
    # for_picker=False（預設）：回傳所有在職員工 + has_account 旗標（供員工頁）
    for_picker = bool(ctx.params.get("for_picker", False))

    try:
        employees = ctx.db.query("hr_employees", limit=500) or []
    except Exception:
        ctx.response.json({"employees": []})
        return

    try:
        departments = ctx.db.query("hr_departments", limit=200) or []
    except Exception:
        departments = []

    def resolve_id(v):
        if isinstance(v, list):
            return str(v[0]) if v else ""
        return str(v or "")

    dept_map = {str(d.get("id", "")): str(d.get("name") or "") for d in departments}

    result = []
    for e in employees:
        if e.get("active") is False:
            continue
        user_id = resolve_id(e.get("user_id"))
        if for_picker and not user_id:
            continue
        dept_id = resolve_id(e.get("department_id"))
        result.append({
            "id": str(e.get("id", "")),
            "name": str(e.get("name") or ""),
            "user_id": user_id,
            "has_account": bool(user_id),
            "job_title": str(e.get("job_title") or ""),
            "work_email": str(e.get("work_email") or ""),
            "department_id": dept_id,
            "department_name": dept_map.get(dept_id, ""),
        })

    ctx.response.json({"employees": result})
