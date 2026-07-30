using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; // LINQ sorguları için eklendi
using STAJ1.Repositories;

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SohbetlerController : ControllerBase
{
    private readonly ISohbetService _sohbetService;
    private readonly IKullaniciService _kullaniciService; 
    private readonly IGenericRepository<SohbetKatilimci> _katilimciRepo; 

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
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Kullanıcı kimliği bulunamadı.");
            var olusturanKullaniciId = int.Parse(userIdString);

            var yeniSohbet = new Sohbet
            {
                grupadi = request.GrupAdi, 
                grupmu = true,
                olusturmaTarihi = DateTime.UtcNow
            };

            var olusturulanSohbet = _sohbetService.SohbetOlustur(yeniSohbet);

            if (!request.KatilimciIdleri.Contains(olusturanKullaniciId))
            {
                request.KatilimciIdleri.Add(olusturanKullaniciId);
            }

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

    // ========================================================================
    // GÜNCELLENEN METOT: SOHBET LİSTESİNDE DİNAMİK İSİMLENDİRME
    // ========================================================================
    [HttpGet("kullanici/{kullaniciId}")]
    public IActionResult KullanicininSohbetleri(int kullaniciId)
    {
        try
        {
            // 1. Kullanıcının tüm sohbetlerini getir
            var sohbetler = _sohbetService.KullanicininSohbetleriniGetir(kullaniciId);
            
            // 2. İsim bulmak için katılımcı ve kullanıcı listelerini çek
            var tumKatilimcilar = _katilimciRepo.HepsiniGetir();
            var tumKullanicilar = _kullaniciService.TumKullanicilariGetir();

            //Grup mu Birebir mi
            var dinamikSohbetListesi = sohbetler.Select(s => 
            {
                string ekranaYazilacakAd = s.grupadi; // Varsayılan olarak kendi adını al

                
                if (!s.grupmu) 
                {
                    
                    var digerKisininKaydi = tumKatilimcilar.FirstOrDefault(k => k.sohbetid == s.id && k.kullaniciid != kullaniciId);
                    
                    if (digerKisininKaydi != null)
                    {
                     
                        var digerKullanici = tumKullanicilar.FirstOrDefault(u => u.Id == digerKisininKaydi.kullaniciid);
                        if (digerKullanici != null)
                        {
                            ekranaYazilacakAd = digerKullanici.AdSoyad; 
                        }
                    }
                }

                
                return new 
                {
                    id = s.id,
                    grupmu = s.grupmu,
                    grupadi = ekranaYazilacakAd, 
                    olusturmaTarihi = s.olusturmaTarihi
                };
            }).ToList();

            return Ok(dinamikSohbetListesi);
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
            var katilimciKayitlari = _katilimciRepo.HepsiniGetir().Where(k => k.sohbetid == sohbetId).ToList();
            var tumKullanicilar = _kullaniciService.TumKullanicilariGetir();

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