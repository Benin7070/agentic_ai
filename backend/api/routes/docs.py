from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent
README_PATH = ROOT_DIR / "README.md"
if not README_PATH.exists():
    README_PATH = BASE_DIR / "README.md"

@router.get("/docs")
async def get_documentation(doc: str = "readme"):
    if doc == "report":
        target_path = ROOT_DIR / "PROJECT_REPORT_MAS.md"
        if not target_path.exists():
            target_path = ROOT_DIR / "safe" / "PROJECT_REPORT_MAS.md"
        if not target_path.exists():
            target_path = BASE_DIR / "PROJECT_REPORT_MAS.md"
        title = "AgentNet MAS — Capstone Project Report"
    else:
        target_path = README_PATH if README_PATH.exists() else (ROOT_DIR / "README.md")
        title = "AgentNet MAS — Architecture Documentation"

    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Documentation file not found at {target_path}")
        
    try:
        content = target_path.read_text(encoding="utf-8")
        return {
            "title": title,
            "markdown": content,
            "path": str(target_path),
            "sizeBytes": len(content.encode("utf-8"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read documentation: {str(e)}")
