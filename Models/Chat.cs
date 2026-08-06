using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;

[Table("sohbetler")]
public class Chat
{
    [Column("id")]
    public int id { get; set; }
    [Column("grupmu")]
    public bool grupmu { get; set; }

    [Column("grupadi")]
    public string grupadi { get; set; } =string.Empty;

    [Column("olusturulmatarihi")]
    public DateTime olusturmaTarihi { get; set; } 
}