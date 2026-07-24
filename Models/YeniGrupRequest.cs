namespace STAJ1.Models;

public class YeniGrupRequest
{
    public string? GrupAdi { get; set; }
    public List<int> KatilimciIdleri { get; set; } = new List<int>();
}