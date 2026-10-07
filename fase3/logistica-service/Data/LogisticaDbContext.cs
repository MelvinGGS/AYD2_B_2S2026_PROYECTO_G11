using Microsoft.EntityFrameworkCore;

namespace LogisticaService.Data
{
    public class LogisticaDbContext : DbContext
    {
        public LogisticaDbContext(DbContextOptions<LogisticaDbContext> options) 
            : base(options) { }

        public DbSet<Despacho> Despachos { get; set; } = null!;
        public DbSet<Rastreo> Rastreos { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Despacho>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.OrdenId).IsRequired();
                entity.Property(e => e.UbicacionOrigen).IsRequired();
                entity.Property(e => e.DireccionDestino).IsRequired();
                entity.Property(e => e.CodigoRastreo).IsRequired();
                entity.Property(e => e.Estado).IsRequired();
            });

            modelBuilder.Entity<Rastreo>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.Property(e => e.CodigoRastreo).IsRequired();
                entity.Property(e => e.Estado).IsRequired();
            });
        }
    }
}