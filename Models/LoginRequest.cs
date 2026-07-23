using System.ComponentModel.DataAnnotations.Schema;
namespace STAJ1.Models;

public class LoginRequest
{
    public string Eposta { get; set; } = string.Empty;
    public string Sifre { get; set; } = string.Empty;
}