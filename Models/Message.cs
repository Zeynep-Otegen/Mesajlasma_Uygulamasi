using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;
    
[Table("mesajlar")]
public class Message
{
    [Column("id")]
    public int id { get; set; }

    [Column("sohbetid")]
    public int sohbetid { get; set; }

    [Column("gonderenkullaniciid")]  
    public int gonderenid { get; set; }
    [Column("icerik")]
    public string icerik { get; set; } =string.Empty;

    [Column("okundumu")]
    public bool okundumu { get; set; }
    [Column("gonderilmetarihi")]
    public DateTime gondermeTarihi { get; set; }
    
    [Column("DosyaYolu")]
    public string? DosyaYolu { get; set; }
}