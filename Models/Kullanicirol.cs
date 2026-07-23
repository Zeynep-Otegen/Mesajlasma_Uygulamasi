using System.ComponentModel.DataAnnotations.Schema;

namespace STAJ1.Models;

[Table("kullanicirol")]
public class Kullanicirol
{
    [Column("id")]
    public int Id { get; set; }

    [Column("kullaniciid")]
    public int KullaniciId { get; set; }

    [Column("rolid")]
    public int RolId { get; set; }

    // Entity Framework'ün ilişkileri anlaması için Navigasyon Özellikleri
    public Kullanici? Kullanici { get; set; }
    public Rol? Rol { get; set; }
}