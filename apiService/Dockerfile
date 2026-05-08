FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copiar archivos de proyecto usando el nuevo contexto (raíz)
COPY ["apiService/InformeObras.csproj", "apiService/"]
RUN dotnet restore "apiService/InformeObras.csproj"

COPY . .
WORKDIR "/src/apiService"
RUN dotnet publish "InformeObras.csproj" -c Release -o /app/out

# Imagen final
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# Instalar Python y dependencias necesarias para la sincronización
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar librería de Excel para Python
RUN pip3 install openpyxl --break-system-packages

# Copiar la aplicación publicada
COPY --from=build /app/out .

# Copiar archivos necesarios para la sincronización desde la raíz
# El script y el excel deben estar en la carpeta superior a /app o dentro
# En Endpoints.cs buscamos en ".." así que los ponemos un nivel arriba o ajustamos
COPY sync_excel_to_json.py /
COPY Plantilla-modelo.xlsx /

EXPOSE 8080
ENTRYPOINT ["dotnet", "InformeObras.dll"]