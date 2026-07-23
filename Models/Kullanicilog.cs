using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;

[Table("kullaniciloglari")]
public class Kullanicilog
{
    [Column("id")]
    public int Id { get; set; }
    
    // PostgreSQL tarafında sütun adı islemtipi şeklinde kayıtlıysa bunu da küçük yapmalısın
    [Column("islemtipi")] 
    public string islemTipi { get; set; } = string.Empty;

    // HATANIN ÇÖZÜMÜ: Sütun adını tamamen küçük harf yaptık
    [Column("ipadresi")] 
    public string IP { get; set; } = string.Empty;

    [Column("tarih")] 
    public DateTime islemTarihi { get; set; }
    
    // ÖNEMLİ EKSİK: Hangi kullanıcının işlem yaptığını tutmak için
    [Column("kullaniciid")]
    public int KullaniciId { get; set; }
}