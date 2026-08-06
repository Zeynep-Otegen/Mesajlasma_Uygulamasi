using Microsoft.EntityFrameworkCore;
namespace STAJ1.Data;
using STAJ1.Models;
public class UygulamaDbContext : DbContext
{
    public UygulamaDbContext(DbContextOptions<UygulamaDbContext> options) : base(options)
    {
    }
    public DbSet<User> kullanicilar { get; set; }
    public DbSet<Role> roller { get; set; }
    public DbSet<UserRole> kullaniciroller { get; set; }
    public DbSet<Chat> sohbetler { get; set; }
    public DbSet<ChatMember> sohbetkatilimcilar { get; set; }
    public DbSet<Message> mesajlar { get; set; }
    public DbSet<UserLog> kullaniciloglar { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder) //Entitiy ler arasındaki ilişkiler tanımlanır.
    {
        // Kullanicirol tablosunun bağlantılarını belirtiyoruz
        modelBuilder.Entity<UserRole>()
            .HasOne(kr => kr.Kullanici)
            .WithMany(k => k.KullaniciRolleri)
            .HasForeignKey(kr => kr.KullaniciId);

        modelBuilder.Entity<UserRole>()
            .HasOne(kr => kr.Rol)
            .WithMany(r => r.KullaniciRolleri)
            .HasForeignKey(kr => kr.RolId);
            
        base.OnModelCreating(modelBuilder);
    }
}