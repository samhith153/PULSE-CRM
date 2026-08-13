"""Run backend uvicorn from backend venv site-packages first, no reload."""
from __future__ import annotations

import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
venv_site = os.path.join(backend_dir, ".venv", "Lib", "site-packages")
if venv_site not in sys.path:
    sys.path.insert(0, venv_site)

os.chdir(backend_dir)

print("python_exe=", sys.executable)
print("sys.path[0:5]=", sys.path[:5])

import uvicorn

uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
