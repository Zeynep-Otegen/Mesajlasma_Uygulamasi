namespace STAJ1.Models;

public class ChatDto
{
    public int SohbetId { get; set; }
    public bool GrupMu { get; set; }
    public string GosterilecekAd { get; set; } = string.Empty;
    public int OkunmamisMesajSayisi { get; set; }
    
}