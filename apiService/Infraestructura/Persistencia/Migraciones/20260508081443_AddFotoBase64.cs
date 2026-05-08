using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InformeObras.Infraestructura.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class AddFotoBase64 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Base64",
                table: "fotos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Base64",
                table: "fotos");
        }
    }
}
