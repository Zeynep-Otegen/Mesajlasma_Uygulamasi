using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; // LINQ sorguları için eklendi

namespace STAJ1.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class MesajlarController : ControllerBase
{
    private readonly IMesajService _mesajService;
    private readonly IKullaniciService _kullaniciService; // İsimleri bulmak için eklendi

    // Constructor güncellendi
    public MesajlarController(IMesajService mesajService, IKullaniciService kullaniciService)
    {
        _mesajService = mesajService;
        _kullaniciService = kullaniciService;
    }

    [HttpGet("sohbet/{sohbetId}")]
    public IActionResult SohbeteAitMesajlariGetir(int sohbetId)
    {
        try
        {
            var mesajlar = _mesajService.SohbeteAitMesajlariGetir(sohbetId);
            var tumKullanicilar = _kullaniciService.TumKullanicilariGetir();

            // Sadece ID değil, İSİM bilgisini de içeren yeni bir yapı (Anonymous Object) oluşturuyoruz
            var mesajListesi = mesajlar.Select(m => new
            {
                m.id,
                m.sohbetid,
                gonderenid = m.gonderenid,
                icerik = m.icerik,
                gondermeTarihi = m.gondermeTarihi,
                // Kullanıcıyı ID'sinden bul, AdSoyad'ı al, yoksa "Bilinmeyen" yaz
                gonderenAd = tumKullanicilar.FirstOrDefault(k => k.Id == m.gonderenid)?.AdSoyad ?? "Bilinmeyen Kullanıcı"
            }).ToList();

            return Ok(mesajListesi);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost]
    public IActionResult MesajGonder([FromBody] Mesaj yeniMesaj)
    {
        try
        {
            _mesajService.MesajGonder(yeniMesaj);
            return Ok("Mesaj başarıyla gönderildi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}