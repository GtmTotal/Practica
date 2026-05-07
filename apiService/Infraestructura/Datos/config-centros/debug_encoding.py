import os

file_path = r"c:\desarrollo-software\reporte-obras-main\apiService\Infraestructura\Datos\config-centros\ANTEQUERA.json"
with open(file_path, "rb") as f:
    content = f.read()

# Check for "Comprobaci" sequence
target = "Comprobaci".encode("utf-8")
idx = content.find(target)
if idx != -1:
    # Look at the next few bytes
    after = content[idx + len(target):idx + len(target) + 4]
    print(f"Bytes after 'Comprobaci': {after.hex(' ')}")
else:
    print("Sequence not found")
