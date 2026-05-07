import os

folder = r"c:\desarrollo-software\reporte-obras-main\apiService\Infraestructura\Datos\config-centros"
files = [f for f in os.listdir(folder) if f.endswith(".json")]

# Map of double-encoded sequences to correct characters
# Handles both printable sequences and raw byte sequences
replacements = {
    # Lowercase (already mostly working, but good to ensure)
    "\u00c3\u00b3": "ó",
    "\u00c3\u00a1": "á",
    "\u00c3\u00a9": "é",
    "\u00c3\u00ad": "í",
    "\u00c3\u00ba": "ú",
    "\u00c3\u00b1": "ñ",
    
    # Uppercase (The problematic ones)
    "\u00c3\u0081": "Á",
    "\u00c3\u0089": "É",
    "\u00c3\u008d": "Í",
    "\u00c3\u0093": "Ó",
    "\u00c3\u009a": "Ú",
    "\u00c3\u0091": "Ñ",
    
    # Common variations seen in double encoding
    "Ã\u008d": "Í",
    "Ã\u0081": "Á",
    "Ã\u0089": "É",
    "Ã\u0093": "Ó",
    "Ã\u009a": "Ú",
    "Ã\u0091": "Ñ"
}

for filename in files:
    path = os.path.join(folder, filename)
    with open(path, "rb") as f:
        raw_content = f.read()
    
    # Try to detect if it's double encoded by looking for C3 83 (Ã in UTF-8)
    # followed by C2 or C3 bytes
    
    try:
        content = raw_content.decode("utf-8-sig")
        new_content = content
        
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
        
        # Manually fix "QUÍMICOS" if it has weird hidden chars
        # The box in the screenshot is likely \x8d
        if "QU\u00c3\u008dMICOS" in new_content:
             new_content = new_content.replace("QU\u00c3\u008dMICOS", "QUÍMICOS")
        
        if new_content != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Repaired uppercase: {filename}")
        else:
            print(f"No changes needed: {filename}")
            
    except Exception as e:
        print(f"Error processing {filename}: {e}")
