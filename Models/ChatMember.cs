using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;

[Table("sohbetkatilimcilari")]
public class ChatMember
{
    [Column("id")]
    public int id { get; set; }

    [Column("sohbetid")]
    public int sohbetid { get; set; }

    [Column("kullaniciid")]
    public int kullaniciid { get; set; }

    [Column("katilmatarihi")]
    public DateTime katilmaTarihi { get; set; }

    [Column("sonokumatarihi")]
    public DateTime? SonOkumaTarihi { get; set; }
}