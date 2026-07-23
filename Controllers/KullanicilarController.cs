using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using STAJ1.Repositories; // Log repository'sine erişmek için eklendi
using Microsoft.AspNetCore.Authorization;
using System; // DateTime.UtcNow kullanabilmek için eklendi

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] 
public class KullanicilarController : ControllerBase
{
    private readonly IKullaniciService _kullaniciService;
    private readonly IGenericRepository<Kullanicilog> _logRepository; // Log tablosu bağlantısı eklendi

    // Constructor'a IGenericRepository<Kullanicilog> parametresi eklendi
    public KullanicilarController(IKullaniciService kullaniciService, IGenericRepository<Kullanicilog> logRepository)
    {
        _kullaniciService = kullaniciService;
        _logRepository = logRepository;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public IActionResult Getir()
    {
        var kullanicilar = _kullaniciService.TumKullanicilariGetir();
        return Ok(kullanicilar); 
    }

    [HttpPost]
    public IActionResult Ekle([FromBody] Kullanici yeniKullanici)
    {
        try
        {
            _kullaniciService.KullaniciEkle(yeniKullanici);
            return Ok("Kullanıcı başarıyla eklendi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message); 
        }
    }

    // PUT: Kullanıcı güncellemek için (api/kullanicilar/1)
    [HttpPut("{id}")]
    public IActionResult Guncelle(int id, [FromBody] Kullanici guncelKullanici)
    {
        try
        {
            _kullaniciService.KullaniciGuncelle(id, guncelKullanici);

            // GÜNCELLEME İŞLEMİ LOGLANIYOR
            var yeniLog = new Kullanicilog
            {
                KullaniciId = id,
                islemTipi = "Profil bilgileri güncellendi",
                islemTarihi = DateTime.UtcNow
            };
            _logRepository.Ekle(yeniLog);

            return Ok("Kullanıcı başarıyla güncellendi ve log kayıtlarına eklendi.");
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
        return BadRequest($"Veritabanı Hatası: {gercekHata}");
            
        }
    }

    // DELETE: Kullanıcı silmek için (api/kullanicilar/1)
    [HttpDelete("{id}")]
    public IActionResult Sil(int id)
    {
        try
        {
            _kullaniciService.KullaniciSil(id);

            // SİLME İŞLEMİ LOGLANIYOR
            var yeniLog = new Kullanicilog
            {
                KullaniciId = id,
                islemTipi = "Kullanıcı silindi (Hesap Kapatma)",
                islemTarihi = DateTime.UtcNow
            };
            _logRepository.Ekle(yeniLog);

            return Ok("Kullanıcı başarıyla silindi ve log kayıtlarına eklendi.");
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }
}