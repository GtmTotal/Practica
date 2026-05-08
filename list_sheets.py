import openpyxl

wb = openpyxl.load_workbook("Plantilla-modelo.xlsx")
print(f"Sheets: {wb.sheetnames}")
