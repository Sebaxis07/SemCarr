# -*- coding: utf-8 -*-
"""
Generador y Administrador de Credenciales Seguras OWASP
Semana de la Carrera 2026 - INACAP Sede Antofagasta
"""

import sys
import os
import json
import secrets
import string
import hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')

def generate_strong_password(length=14):
    chars = string.ascii_letters + string.digits + "!@#$%&*"
    # Garantizar que tenga al menos 1 mayus, 1 minus, 1 digito y 1 simbolo
    while True:
        pwd = ''.join(secrets.choice(chars) for _ in range(length))
        if (any(c.islower() for c in pwd) and
            any(c.isupper() for c in pwd) and
            any(c.isdigit() for c in pwd) and
            any(c in "!@#$%&*" for c in pwd)):
            return pwd

def hash_scrypt(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    salt_bytes = salt.encode('utf-8')
    key = hashlib.scrypt(password.encode('utf-8'), salt=salt_bytes, n=16384, r=8, p=1, maxmem=0, dklen=64)
    return f"{salt}:{key.hex()}"

def initialize_credentials(rotate=False):
    accounts = [
        {"username": "admin", "name": "Superadministrador (Jefatura/Soporte)", "role": "admin", "default_pwd": "InacapAdmin2026!"},
        {"username": "coordinacion", "name": "Coordinadora General de Carrera", "role": "coordinacion", "default_pwd": "CoordSemana2026#"},
        {"username": "mesa", "name": "Mesa de Control / Juez de Cancha", "role": "mesa", "default_pwd": "MesaCancha2026*"},
        {"username": "docente1", "name": "Docente Evaluador 1 (Rúbricas)", "role": "docente", "default_pwd": "DocenteJuez1_2026"},
        {"username": "docente2", "name": "Docente Evaluador 2 (Rúbricas)", "role": "docente", "default_pwd": "DocenteJuez2_2026"}
    ]

    creds_to_save = {}
    passwords_to_display = []

    for acc in accounts:
        pwd = generate_strong_password(16) if rotate else acc["default_pwd"]
        pwd_hash = hash_scrypt(pwd)
        creds_to_save[acc["username"]] = {
            "username": acc["username"],
            "name": acc["name"],
            "role": acc["role"],
            "passwordHash": pwd_hash,
            "updatedAt": "2026-11-09T21:00:00Z"
        }
        passwords_to_display.append({
            "username": acc["username"],
            "name": acc["name"],
            "role": acc["role"],
            "password": pwd
        })

    with open(CREDENTIALS_FILE, 'w', encoding='utf-8') as f:
        json.dump(creds_to_save, f, ensure_ascii=False, indent=2)

    print("\n===================================================================")
    print("      CREDENCIALES ADMINISTRATIVAS OFICIALES - SEMANA 2026")
    print("===================================================================")
    print("  Las contraseñas se almacenan con hash SCRYPT en credentials.json.")
    print("  Entrega estas credenciales únicamente a las personas autorizadas:")
    print("-------------------------------------------------------------------")
    for item in passwords_to_display:
        print(f"  Usuario:      {item['username']}")
        print(f"  Rol:          {item['role']}")
        print(f"  Nombre:       {item['name']}")
        print(f"  Contraseña:   {item['password']}")
        print("-------------------------------------------------------------------")
    print("\n[OK] Credenciales generadas y activas en el servidor.")

if __name__ == '__main__':
    rotate = '--rotate' in sys.argv
    initialize_credentials(rotate)
