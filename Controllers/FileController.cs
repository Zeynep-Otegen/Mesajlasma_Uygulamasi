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

            try
            {
                // wwwroot/uploads klasörü
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                
                
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                //Dosya ism eşsiz (Aynı isimde iki dosya yüklenirse birbirini ezmesin diye GUID kullanıyoruz)
                var orjinalUzantı = Path.GetExtension(file.FileName);
                var benzersizDosyaAdi = Guid.NewGuid().ToString() + orjinalUzantı;
                
                var dosyaYolu = Path.Combine(uploadsFolder, benzersizDosyaAdi);

                //Dosyayı sunucuya kopyala/kaydet
                using (var stream = new FileStream(dosyaYolu, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // URL yolunu oluştur
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