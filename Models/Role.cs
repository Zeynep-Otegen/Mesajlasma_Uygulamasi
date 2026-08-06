using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace STAJ1.Models;

[Table("rol")]
public class Role
{
    [Column("id")]
    public int Id { get; set; }
    
    [Column("roladi")]
    public string RolAdi { get; set; } = string.Empty;

    // Çoka Çok İlişki: Ara tabloya referans
    public ICollection<UserRole>? KullaniciRolleri { get; set; }
}