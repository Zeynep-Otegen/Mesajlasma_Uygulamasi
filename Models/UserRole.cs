using System.ComponentModel.DataAnnotations.Schema;

namespace STAJ1.Models;

[Table("kullanicirol")]
public class UserRole
{
    [Column("id")]
    public int Id { get; set; }

    [Column("kullaniciid")]
    public int KullaniciId { get; set; }

    [Column("rolid")]
    public int RolId { get; set; }

    // Entity Framework'ün ilişkileri anlaması için Navigasyon Özellikleri
    public User? Kullanici { get; set; }
    public Role? Rol { get; set; }
}