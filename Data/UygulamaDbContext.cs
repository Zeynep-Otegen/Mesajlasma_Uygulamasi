using Microsoft.EntityFrameworkCore;
namespace STAJ1.Data;
using STAJ1.Models;
public class UygulamaDbContext : DbContext
{
    public UygulamaDbContext(DbContextOptions<UygulamaDbContext> options) : base(options)
    {
    }
    public DbSet<Kullanici> kullanicilar { get; set; }
    public DbSet<Rol> roller { get; set; }
    public DbSet<Kullanicirol> kullaniciroller { get; set; }
    public DbSet<Sohbet> sohbetler { get; set; }
    public DbSet<SohbetKatilimci> sohbetkatilimcilar { get; set; }
    public DbSet<Mesaj> mesajlar { get; set; }
    public DbSet<Kullanicilog> kullaniciloglar { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder) //Entitiy ler arasındaki ilişkiler tanımlanır.
    {
        // Kullanicirol tablosunun bağlantılarını açıkça belirtiyoruz
        modelBuilder.Entity<Kullanicirol>()
            .HasOne(kr => kr.Kullanici)
            .WithMany(k => k.KullaniciRolleri)
            .HasForeignKey(kr => kr.KullaniciId);

        modelBuilder.Entity<Kullanicirol>()
            .HasOne(kr => kr.Rol)
            .WithMany(r => r.KullaniciRolleri)
            .HasForeignKey(kr => kr.RolId);
            
        base.OnModelCreating(modelBuilder);
    }
}