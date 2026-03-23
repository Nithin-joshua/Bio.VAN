import os
import re

file_path = "main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Add Query and Optional (if missing) to imports
if "from fastapi import Query" not in content and "from fastapi import Depends, Query" not in content:
    content = content.replace(
        "from fastapi import Depends", 
        "from fastapi import Depends, Query"
    )

# Fix 2: First File Check (check_liveness)
content = re.sub(
    r"if not file.filename.lower\(\).endswith\(\('\.wav', '\.webm', '\.ogg', '\.mp3'\)\):\s+pass",
    "if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):\n        raise HTTPException(status_code=400, detail=f\"Unsupported audio format: {file.filename}\")",
    content
)

# Fix 3: Optional Password in enroll
content = re.sub(
    r"role: str = Form\(\.\.\),\s+# password: str = Form\(\.\.\), # Removed by user request",
    "role: str = Form(...),\n    password: Optional[str] = Form(None),",
    content
)

# Fix 4: Second File Check (enroll loop)
content = re.sub(
    r"if not file.filename.lower\(\).endswith\(\('\.wav', '\.webm', '\.ogg', '\.mp3'\)\):\s+# Fast fail for invalid formats\s+pass",
    "if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):\n                raise HTTPException(status_code=400, detail=f\"Unsupported audio format: {file.filename}\")",
    content
)

# Fix 5: ASR Unavailable
content = re.sub(
    r"if transcribed == \"ASR_UNAVAILABLE\":\s+print\(f\"DEBUG: ASR unavailable\. Skipping challenge verification for Sample {i\+1}\.\"\)",
    "if transcribed == \"ASR_UNAVAILABLE\":\n                        print(f\"DEBUG: ASR unavailable. Failing challenge verification for Sample {i+1}.\")\n                        raise HTTPException(status_code=500, detail=\"ASR unavailable. Cannot verify challenge phrase.\")",
    content
)

# Fix 6: Hash Password inside enroll
content = content.replace(
    "voice_uuid = str(uuid.uuid4())\n        \n        # Create User",
    "voice_uuid = str(uuid.uuid4())\n        \n        hashed_pw = get_password_hash(password) if password else None\n        \n        # Create User"
)
content = content.replace(
    "create_user, full_name, email, role, user_id=speaker_id, hashed_password=None, voice_uuid=voice_uuid",
    "create_user, full_name, email, role, user_id=speaker_id, hashed_password=hashed_pw, voice_uuid=voice_uuid"
)

# Fix 7: verify speaker_id query and verify file validation
content = re.sub(
    r"speaker_id: Optional\[str\] = None,",
    "speaker_id: Optional[str] = Query(None),",
    content
)
content = re.sub(
    r"if not file.filename.lower\(\).endswith\(\('\.wav', '\.webm', '\.ogg', '\.mp3'\)\):\s+# Frontend sends \.wav now, but good to be permissive\s+pass",
    "if not file.filename.lower().endswith(('.wav', '.webm', '.ogg', '.mp3')):\n         raise HTTPException(status_code=400, detail=f\"Unsupported audio format: {file.filename}\")",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated main.py")
