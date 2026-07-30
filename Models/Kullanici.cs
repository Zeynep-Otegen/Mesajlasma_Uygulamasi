using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace STAJ1.Models;

[Table("kullanicilar")]
public class Kullanici
{
    [Column("id")]
    public int Id { get; set; }
    
    [Column("adsoyad")]
    public string AdSoyad { get; set; } = string.Empty;
    
    [Column("eposta")]
    public string Eposta { get; set; } = string.Empty;
    
    [Column("sifrehash")]
    public string SifreHash { get; set; } = string.Empty;

    public bool CevrimiciMi { get; set; } = false;

    public DateTime? SonGorulme { get; set; }
    // Çoka Çok İlişki: Kullanıcının sahip olduğu roller (Ara tablo üzerinden)
    public ICollection<Kullanicirol>? KullaniciRolleri { get; set; }
}