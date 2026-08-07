using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace STAJ1.Controllers 
{
    [Route("api/dosyalar")]
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
     var yil = DateTime.Now.Year.ToString();
     var ay = DateTime.Now.Month.ToString("D2");
     var gun = DateTime.Now.Day.ToString("D2");
    
    var guvenliDosyaAdi = Guid.NewGuid().ToString() + dosyaUzantisi;

    // Dosyanın kaydedileceği klasör yolu 
    var anaKlasor = Path.Combine(Directory.GetCurrentDirectory(), "PrivateUploads", yil, ay, gun);

    // Eğer klasör yoksa oluştur
    if (!Directory.Exists(anaKlasor))
    {
        Directory.CreateDirectory(anaKlasor);
    }

    var tamYol = Path.Combine(anaKlasor, guvenliDosyaAdi);

    // Dosyayı sunucuya kaydet
    using (var stream = new FileStream(tamYol, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Frontend'in dosyaya ulaşabilmesi için erişim linkini dönüyoruz
    var dosyaErisimLinki = $"/api/dosyalar/indir/{yil}/{ay}/{gun}/{guvenliDosyaAdi}";
    
    return Ok(new { dosyaYolu = dosyaErisimLinki });
        }
        [HttpGet("indir/{yil}/{ay}/{gun}/{dosyaAdi}")]
        public IActionResult DosyaIndir(string yil, string ay, string gun, string dosyaAdi)
        {
            var tamYol = Path.Combine(Directory.GetCurrentDirectory(), "PrivateUploads", yil, ay, gun, dosyaAdi);

            if (!System.IO.File.Exists(tamYol))
            {
                return NotFound("Dosya bulunamadı veya silinmiş.");
            }

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(tamYol, out var contentType))
            {
                contentType = "application/octet-stream"; 
            }

            return PhysicalFile(tamYol, contentType);
        }
    }
    
}