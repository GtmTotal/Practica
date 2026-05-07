import os

folder = r"c:\desarrollo-software\reporte-obras-main\apiService\Infraestructura\Datos\config-centros"
files = [f for f in os.listdir(folder) if f.endswith(".json")]

replacements = {
    "Ã³": "ó",
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Ã ": "Í", # Usually Í followed by something
    "Ã“": "Ó",
    "Ãš": "Ú",
    "Ã‰": "É",
    "Ã ": "Á",
    "Ã‘": "Ñ",
    "â‚¬": "€",
    "Ã²": "ò",
    "Ã ": "à"
}

for filename in files:
    path = os.path.join(folder, filename)
    with open(path, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
    
    # Special case for QUÃ MICOS which I saw in the screenshot
    new_content = new_content.replace("QUÃ MICOS", "QUÍMICOS")
    new_content = new_content.replace("ComprobaciÃ³n", "Comprobación")
    
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Repaired: {filename}")
    else:
        print(f"No changes needed: {filename}")
