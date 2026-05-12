using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InformeObras.Infraestructura.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class AddDescripcionAFoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "fotos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "fotos");
        }
    }
}
