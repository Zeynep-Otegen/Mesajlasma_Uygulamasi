using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SeninProjeAdin.Controllers // "SeninProjeAdin" kısmını kendi projene göre düzelt
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Dosya yüklemek için giriş yapmış (token almış) olmayı zorunlu kılıyoruz
    public class DosyalarController : ControllerBase
    {
        [HttpPost("yukle")]
        public async Task<IActionResult> DosyaYukle([FromForm] IFormFile file, [FromForm] int sohbetId, [FromForm] int gonderenId)
        {
            // 1. Dosyanın gelip gelmediğini kontrol et
            if (file == null || file.Length == 0)
            {
                return BadRequest("Lütfen geçerli bir dosya seçin.");
            }

            try
            {
                // 2. Dosyaların kaydedileceği klasörü belirle (wwwroot/uploads klasörü)
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                
                // Eğer "uploads" adında bir klasör henüz yoksa, otomatik oluştur
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // 3. Dosya ismini eşsiz yap (Aynı isimde iki dosya yüklenirse birbirini ezmesin diye GUID kullanıyoruz)
                var orjinalUzantı = Path.GetExtension(file.FileName);
                var benzersizDosyaAdi = Guid.NewGuid().ToString() + orjinalUzantı;
                
                var dosyaYolu = Path.Combine(uploadsFolder, benzersizDosyaAdi);

                // 4. Dosyayı sunucuya (fiziksel olarak) kopyala/kaydet
                using (var stream = new FileStream(dosyaYolu, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // 5. Frontend tarafında bu dosyayı gösterebilmek için URL yolunu oluştur
                var erisimUrl = $"/uploads/{benzersizDosyaAdi}";

                return Ok(new { mesaj = "Dosya başarıyla yüklendi", dosyaYolu = erisimUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }
    }
}