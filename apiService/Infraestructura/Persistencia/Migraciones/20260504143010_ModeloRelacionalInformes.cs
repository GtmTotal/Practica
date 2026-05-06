using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InformeObras.Infraestructura.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class ModeloRelacionalInformes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "datos",
                table: "informes");

            migrationBuilder.AddColumn<string>(
                name: "conclusiones",
                table: "informes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "protegido",
                table: "informes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "tecnico",
                table: "informes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "sistemas",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    informe_id = table.Column<long>(type: "bigint", nullable: false),
                    titulo = table.Column<string>(type: "text", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    prefijo = table.Column<int>(type: "integer", nullable: false),
                    observaciones = table.Column<string>(type: "text", nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemas", x => x.id);
                    table.ForeignKey(
                        name: "FK_sistemas_informes_informe_id",
                        column: x => x.informe_id,
                        principalTable: "informes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "fotos",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sistema_id = table.Column<long>(type: "bigint", nullable: false),
                    object_key = table.Column<string>(type: "text", nullable: false),
                    url_publica = table.Column<string>(type: "text", nullable: true),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fotos", x => x.id);
                    table.ForeignKey(
                        name: "FK_fotos_sistemas_sistema_id",
                        column: x => x.sistema_id,
                        principalTable: "sistemas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tareas",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sistema_id = table.Column<long>(type: "bigint", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: false),
                    rev = table.Column<bool>(type: "boolean", nullable: false),
                    ok = table.Column<bool>(type: "boolean", nullable: false),
                    no_ok = table.Column<bool>(type: "boolean", nullable: false),
                    nota_tarea = table.Column<string>(type: "text", nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tareas", x => x.id);
                    table.ForeignKey(
                        name: "FK_tareas_sistemas_sistema_id",
                        column: x => x.sistema_id,
                        principalTable: "sistemas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fotos_sistema_id",
                table: "fotos",
                column: "sistema_id");

            migrationBuilder.CreateIndex(
                name: "IX_sistemas_informe_id",
                table: "sistemas",
                column: "informe_id");

            migrationBuilder.CreateIndex(
                name: "IX_tareas_sistema_id",
                table: "tareas",
                column: "sistema_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "fotos");

            migrationBuilder.DropTable(
                name: "tareas");

            migrationBuilder.DropTable(
                name: "sistemas");

            migrationBuilder.DropColumn(
                name: "conclusiones",
                table: "informes");

            migrationBuilder.DropColumn(
                name: "protegido",
                table: "informes");

            migrationBuilder.DropColumn(
                name: "tecnico",
                table: "informes");

            migrationBuilder.AddColumn<JsonDocument>(
                name: "datos",
                table: "informes",
                type: "jsonb",
                nullable: false);
        }
    }
}
