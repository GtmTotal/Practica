import openpyxl

wb = openpyxl.load_workbook("Plantilla-modelo.xlsx")
sheet = wb["MERCAPALMA"]
print(f"Sheet: MERCAPALMA")
for i, row in enumerate(sheet.iter_rows(max_row=20, values_only=True)):
    print(f"Row {i+1}: {row}")
