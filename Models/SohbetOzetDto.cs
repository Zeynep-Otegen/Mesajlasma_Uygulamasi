public class SohbetOzetDto
{
    public int id { get; set; }
    public bool grupmu { get; set; }
    public string grupadi { get; set; } = string.Empty;
    public DateTime olusturmaTarihi { get; set; }
    public int okunmamisMesajSayisi { get; set; }
    public string sonMesajIcerik { get; set; } = string.Empty;
    public DateTime sonMesajTarihi { get; set; }
    public string sonMesajGonderenAd { get; set; } = string.Empty;
    public int sonMesajGonderenId { get; set; }
}