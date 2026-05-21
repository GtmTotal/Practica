using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia.Entidades;

namespace InformeObras.Infraestructura.Persistencia;

public class ContextoBaseDatos(DbContextOptions<ContextoBaseDatos> options) : DbContext(options)
{
    public DbSet<Informe> Informes => Set<Informe>();
    public DbSet<Cuatrimestre> Cuatrimestres => Set<Cuatrimestre>();
    public DbSet<Sistema> Sistemas => Set<Sistema>();
    public DbSet<Tarea> Tareas => Set<Tarea>();
    public DbSet<Foto> Fotos => Set<Foto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Informe>(e =>
        {
            e.ToTable("informes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.NombreObra).HasColumnName("nombre_obra");
            e.Property(x => x.Fecha).HasColumnName("fecha");
            e.Property(x => x.Cuatrimestre).HasColumnName("cuatrimestre");
            e.Property(x => x.Modificado).HasColumnName("modificado");
            e.Property(x => x.Tecnico).HasColumnName("tecnico");
            e.Property(x => x.Conclusiones).HasColumnName("conclusiones");
            e.Property(x => x.Protegido).HasColumnName("protegido");
            e.Property(x => x.Datos).HasColumnName("datos");
        });

        modelBuilder.Entity<Cuatrimestre>(e =>
        {
            e.ToTable("cuatrimestres");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Clave).HasColumnName("clave");
            e.Property(x => x.FechaBase).HasColumnName("fecha_base");
            e.Property(x => x.CreadoEn).HasColumnName("creado_en");
        });

        modelBuilder.Entity<Sistema>(e =>
        {
            e.ToTable("sistemas");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.InformeId).HasColumnName("informe_id");
            e.Property(x => x.Titulo).HasColumnName("titulo");
            e.Property(x => x.Tipo).HasColumnName("tipo");
            e.Property(x => x.Prefijo).HasColumnName("prefijo");
            e.Property(x => x.Observaciones).HasColumnName("observaciones");
            e.Property(x => x.Orden).HasColumnName("orden");
        });

        modelBuilder.Entity<Tarea>(e =>
        {
            e.ToTable("tareas");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.SistemaId).HasColumnName("sistema_id");
            e.Property(x => x.Descripcion).HasColumnName("descripcion");
            e.Property(x => x.Rev).HasColumnName("rev");
            e.Property(x => x.Ok).HasColumnName("ok");
            e.Property(x => x.NoOk).HasColumnName("no_ok");
            e.Property(x => x.NotaTarea).HasColumnName("nota_tarea");
            e.Property(x => x.Orden).HasColumnName("orden");
        });

        modelBuilder.Entity<Foto>(e =>
        {
            e.ToTable("fotos");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.SistemaId).HasColumnName("sistema_id");
            e.Property(x => x.ObjectKey).HasColumnName("object_key");
            e.Property(x => x.UrlPublica).HasColumnName("url_publica");
            e.Property(x => x.Nombre).HasColumnName("nombre");
            e.Property(x => x.Orden).HasColumnName("orden");
        });

        modelBuilder.Entity<Cuatrimestre>()
            .HasIndex(x => x.Clave)
            .IsUnique();

        modelBuilder.Entity<Informe>()
            .HasMany(x => x.Sistemas)
            .WithOne(x => x.Informe)
            .HasForeignKey(x => x.InformeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Sistema>()
            .HasMany(x => x.Tareas)
            .WithOne(x => x.Sistema)
            .HasForeignKey(x => x.SistemaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Sistema>()
            .HasMany(x => x.Fotos)
            .WithOne(x => x.Sistema)
            .HasForeignKey(x => x.SistemaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
