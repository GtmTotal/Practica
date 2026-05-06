using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InformeObras.Infraestructura.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class TablaCuatrimestres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cuatrimestres",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    clave = table.Column<string>(type: "text", nullable: false),
                    fecha_base = table.Column<DateOnly>(type: "date", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cuatrimestres", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cuatrimestres_clave",
                table: "cuatrimestres",
                column: "clave",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cuatrimestres");
        }
    }
}
