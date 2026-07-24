using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using STAJ1.Repositories;

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SohbetlerController : ControllerBase
{
    private readonly ISohbetService _sohbetService;
private readonly IKullaniciService _kullaniciService; // Eklendi
    private readonly IGenericRepository<SohbetKatilimci> _katilimciRepo; // Eklendi

    // Constructor güncellendi
    public SohbetlerController(
        ISohbetService sohbetService, 
        IKullaniciService kullaniciService, 
        IGenericRepository<SohbetKatilimci> katilimciRepo)
    {
        _sohbetService = sohbetService;
        _kullaniciService = kullaniciService;
        _katilimciRepo = katilimciRepo;
    }

    [HttpPost("olustur")]
    public IActionResult SohbetOlustur([FromBody] Sohbet yeniSohbet)
    {
        try
        {
            var olusturulanSohbet = _sohbetService.SohbetOlustur(yeniSohbet);
            return Ok(olusturulanSohbet);
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpPost("{sohbetId}/kullanici-ekle/{kullaniciId}")]
    public IActionResult KullaniciEkle(int sohbetId, int kullaniciId)
    {
        try
        {
            _sohbetService.KullaniciyiSohbeteEkle(sohbetId, kullaniciId);
            return Ok("Kullanıcı sohbete başarıyla eklendi.");
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }
[HttpPost("grup-olustur")]
public IActionResult GrupOlustur([FromBody] YeniGrupRequest request)
{
    try
    {
        // 1. İsteği yapan kullanıcının (senin) kimliğini al
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Kullanıcı kimliği bulunamadı.");
        var olusturanKullaniciId = int.Parse(userIdString);

        // 2. Senin modeline uygun Sohbet nesnesini hazırla
        var yeniSohbet = new Sohbet
        {
            grupadi = request.GrupAdi, // Modelindeki harf büyüklüklerine göre düzelt (grupadi/GrupAdi)
            grupmu = true,
            olusturmaTarihi = DateTime.UtcNow
        };

        // 3. İŞTE BURASI: Senin yazdığın 'SohbetOlustur' metodunu kullanıyoruz!
        var olusturulanSohbet = _sohbetService.SohbetOlustur(yeniSohbet);

        // Grubu kuran kişiyi de listeye ekle
        if (!request.KatilimciIdleri.Contains(olusturanKullaniciId))
        {
            request.KatilimciIdleri.Add(olusturanKullaniciId);
        }

        // 4. İŞTE BURASI: Senin yazdığın 'KullaniciyiSohbeteEkle' metodunu kullanıyoruz!
        foreach (var kullaniciId in request.KatilimciIdleri)
        {
            _sohbetService.KullaniciyiSohbeteEkle(olusturulanSohbet.id, kullaniciId);
        }

        return Ok(new { mesaj = "Grup başarıyla oluşturuldu!", sohbetId = olusturulanSohbet.id });
    }
    catch (Exception ex)
    {
        return BadRequest("Hata: " + ex.Message);
    }
}
    [HttpGet("kullanici/{kullaniciId}")]
    public IActionResult KullanicininSohbetleri(int kullaniciId)
    {
        try
        {
            var sohbetler = _sohbetService.KullanicininSohbetleriniGetir(kullaniciId);
            return Ok(sohbetler);
        }
      catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Hata: {gercekHata}");
        }
    }



    [HttpGet("{sohbetId}/katilimcilar")]
    public IActionResult GruptakiKisileriGetir(int sohbetId)
    {
        try
        {
            // 1. Bu sohbete ait katılımcı kayıtlarını bul
            var katilimciKayitlari = _katilimciRepo.HepsiniGetir().Where(k => k.sohbetid == sohbetId).ToList();

            // 2. Tüm kullanıcıları getir
            var tumKullanicilar = _kullaniciService.TumKullanicilariGetir();

            // 3. Eşleştirip sadece isim ve e-posta döndür
            var gruptakiKisiler = katilimciKayitlari.Select(k => {
                var kullanici = tumKullanicilar.FirstOrDefault(u => u.Id == k.kullaniciid);
                return new {
                    id = k.kullaniciid,
                    adsoyad = kullanici != null ? kullanici.AdSoyad : "Bilinmeyen",
                    eposta = kullanici != null ? kullanici.Eposta : ""
                };
            }).ToList();

            return Ok(gruptakiKisiler);
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Hata: {gercekHata}");
        }
    }
}