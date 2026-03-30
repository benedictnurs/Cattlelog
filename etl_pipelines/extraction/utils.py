"""Shared utilities for name normalization and course code formatting."""

import unicodedata
import re
import os
from typing import Tuple


def get_data_dir(script_file_path: str) -> str:
    """
    Determine the data directory path.
    """
    if 'DATA_DIR' in os.environ:
        return os.environ['DATA_DIR']
    
    script_dir = os.path.dirname(os.path.abspath(script_file_path))
        
    if os.path.basename(script_dir) == 'extraction':
        parent_dir = os.path.dirname(script_dir)
        return os.path.join(parent_dir, 'data')
    
    return os.path.join(script_dir, 'data')


def normalize_name(name: str) -> str:
    """Normalize name to ASCII letters and spaces. Removes accents and special chars.
    
    Examples: "José" -> "Jose", "O'Brien" -> "OBrien", "Joël Porquet-Lupine" -> "Joel Porquet Lupine"
    """
    if not name:
        return ""
    
    name = name.replace('-', ' ')
    name = unicodedata.normalize('NFKD', name)
    name = ''.join(char for char in name if not unicodedata.combining(char))
    name = ''.join(char for char in name if char.isalpha() or char.isspace())
    name = ' '.join(name.split())
    
    return name


def create_professor_id(first_name_raw: str, last_name_raw: str) -> Tuple[str, str]:
    """Create normalized professor_id and display name. Returns (professor_id, normalized_full_name).
    
    Examples: ("John", "Smith") -> ("john-smith", "John Smith")
              ("María José", "García López") -> ("maria-jose-garcia-lopez", "Maria Jose Garcia Lopez")
    """
    first_name_full = normalize_name(first_name_raw)
    last_name_full = normalize_name(last_name_raw)
    
    first_parts = first_name_full.split()
    if len(first_parts) > 1:
        first_name = first_parts[0]
        middle_name = " ".join(first_parts[1:])
    else:
        first_name = first_name_full
        middle_name = ""
    
    last_name = last_name_full
    
    first_name_display = first_name.capitalize() if first_name else ""
    middle_name_display = middle_name.title() if middle_name else ""
    last_name_display = last_name.title() if last_name else ""
    
    if middle_name_display:
        full_name = f"{first_name_display} {middle_name_display} {last_name_display}".strip()
    else:
        full_name = f"{first_name_display} {last_name_display}".strip()
    
    first_id_parts = first_name_full.lower().replace(" ", "-")
    last_id_parts = last_name.lower().replace(" ", "-")
    prof_id = f"{first_id_parts}-{last_id_parts}"
    prof_id = re.sub(r'-+', '-', prof_id).strip('-')
    
    if not prof_id:
        prof_id = "unknown"
    
    return prof_id, full_name


def _pad_course_number(num: str) -> str:
    """Pad course numbers to 3 digits. Examples: "1" -> "001", "32" -> "032", "100" -> "100"."""
    if len(num) <= 2:
        return num.zfill(3)
    return num


def normalize_course_code(code: str = None, subject: str = None, course_num: str = None) -> str:
    """Normalize course codes to UC Davis format (e.g., "ECS 32" -> "ECS032").
    
    Examples: "STA 130B" -> "STA130B", "ECS 32" -> "ECS032"
              subject="ECS", course_num="32" -> "ECS032"
    """
    if subject is not None and course_num is not None:
        subj = subject.strip().upper()
        num = str(course_num).strip()
        if num.isdigit():
            num = _pad_course_number(num)
        return f"{subj}{num}"
    
    if not code:
        return "N/A"
    
    s = re.sub(r"[^A-Za-z0-9]", "", code.strip().upper())
    s = re.sub(r"^([A-Z]{3,4})[A-Z]+(?=\d)", r"\1", s)
    
    m = re.match(r"^([A-Z]{3,4})(\d{1,4})([A-Z]{0,2})$", s)
    if not m:
        return "N/A"
    
    dept, num, suf = m.groups()
    num = _pad_course_number(num)
    suf = suf[:2]
    
    return f"{dept}{num}{suf}"

