using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using STAJ1.Repositories; 
using Microsoft.AspNetCore.Authorization;
using System; 
using System.Linq; // LINQ sorguları için eklendi

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] 
public class KullanicilarController : ControllerBase
{
    private readonly IKullaniciService _kullaniciService;
    private readonly IGenericRepository<Kullanicilog> _logRepository; 
    private readonly IRedisService _redisService; // YENİ EKLENDİ

    public KullanicilarController(
        IKullaniciService kullaniciService, 
        IGenericRepository<Kullanicilog> logRepository,
        IRedisService redisService) // YENİ EKLENDİ
    {
        _kullaniciService = kullaniciService;
        _logRepository = logRepository;
        _redisService = redisService;
    }

    [Authorize]
    [HttpGet]
    public IActionResult Getir()
    {
        // 1. Veritabanından (PostgreSQL) herkesi çek
        var kullanicilar = _kullaniciService.TumKullanicilariGetir();
        
        // 2. RAM'den (Redis) sadece online olanların ID listesini çek
        var onlineKullaniciIdleri = _redisService.CevrimiciKullanicilariGetir();

        // 3. Verileri birleştirip (DTO Mantığı) Frontend'e yolla
        var sonuc = kullanicilar.Select(k => new 
        {
            Id = k.Id,
            AdSoyad = k.AdSoyad,
            Eposta = k.Eposta,
            // Eğer kişinin ID'si Redis listesinde varsa TRUE döner
            CevrimiciMi = onlineKullaniciIdleri.Contains(k.Id) 
        }).ToList();

        return Ok(sonuc); 
    }

    [Authorize] 
    [HttpGet("grup-icin-liste")]
    public IActionResult GrupIcinKullanicilariGetir()
    {
        var kullanicilar = _kullaniciService.TumKullanicilariGetir()
            .Select(k => new { 
                id = k.Id, 
                adsoyad = k.AdSoyad, 
                eposta = k.Eposta 
            }) 
            .ToList();
            
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

    [HttpPut("{id}")]
    public IActionResult Guncelle(int id, [FromBody] Kullanici guncelKullanici)
    {
        try
        {
            _kullaniciService.KullaniciGuncelle(id, guncelKullanici);

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

    [HttpDelete("{id}")]
    public IActionResult Sil(int id)
    {
        try
        {
            _kullaniciService.KullaniciSil(id);

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