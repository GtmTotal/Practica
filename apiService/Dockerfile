FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install openpyxl --break-system-packages

COPY --from=build /app/out .

# Copiar archivos para la sincronización (ahora están en el contexto local)
COPY sync_excel_to_json.py .
COPY Plantilla-modelo.xlsx .

EXPOSE 8080
ENTRYPOINT ["dotnet", "InformeObras.dll"]