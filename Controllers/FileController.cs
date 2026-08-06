using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SeninProjeAdin.Controllers 
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class FileController : ControllerBase
    {
        [HttpPost("yukle")]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file, [FromForm] int sohbetId, [FromForm] int gonderenId)
        {
          
           
    if (file == null || file.Length == 0)
    {
        return BadRequest("Lütfen geçerli bir dosya seçin.");
    }

    // Maksimum 5 MB - DoS Saldırısı Koruması
    const long maxBoyut = 5 * 1024 * 1024; // 5 MB
    if (file.Length > maxBoyut)
    {
        return BadRequest("Dosya boyutu 5 MB'den büyük olamaz!");
    }

    
    var izinVerilenUzantilar = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".docx", ".txt" };
    var dosyaUzantisi = Path.GetExtension(file.FileName).ToLowerInvariant();

    if (string.IsNullOrEmpty(dosyaUzantisi) || !izinVerilenUzantilar.Contains(dosyaUzantisi))
    {
        return BadRequest("Güvenlik ihlali: Bu dosya türünün yüklenmesine izin verilmiyor!");
    }

    
    var guvenliDosyaAdi = Guid.NewGuid().ToString() + dosyaUzantisi;

    // Dosyanın kaydedileceği klasör yolu 
    var kayitYolu = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

    // Eğer klasör yoksa oluştur
    if (!Directory.Exists(kayitYolu))
    {
        Directory.CreateDirectory(kayitYolu);
    }

    var tamYol = Path.Combine(kayitYolu, guvenliDosyaAdi);

    // Dosyayı sunucuya kaydet
    using (var stream = new FileStream(tamYol, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Frontend'in dosyaya ulaşabilmesi için erişim linkini dönüyoruz
    var dosyaErisimLinki = $"/uploads/{guvenliDosyaAdi}";
    
    return Ok(new { dosyaYolu = dosyaErisimLinki });
        }
    }
}