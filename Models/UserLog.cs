using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;

[Table("kullaniciloglari")]
public class UserLog
{
     //Postsql tarafında alanların uyuşmamazlığıdan kaynaklanan hataların hepsi giderildi.
    [Column("id")]
    public int Id { get; set; }
    
   
    [Column("islemtipi")] 
    public string islemTipi { get; set; } = string.Empty;

   
    [Column("ipadresi")] 
    public string IP { get; set; } = string.Empty;

    [Column("tarih")] 
    public DateTime islemTarihi { get; set; }
    
   
    [Column("kullaniciid")]
    public int KullaniciId { get; set; }
}