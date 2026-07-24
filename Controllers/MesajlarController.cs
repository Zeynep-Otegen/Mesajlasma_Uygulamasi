using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; // LINQ sorguları için eklendi
using Microsoft.AspNetCore.SignalR; // SignalR için eklendi
using STAJ1.Hubs;

namespace STAJ1.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class MesajlarController : ControllerBase
{
    private readonly IMesajService _mesajService;
    private readonly IKullaniciService _kullaniciService; // İsimleri bulmak için eklendi
    private readonly IHubContext<ChatHub> _hubContext;

    // Constructor güncellendi
   public MesajlarController(IMesajService mesajService, IKullaniciService kullaniciService, IHubContext<ChatHub> hubContext)
    {
        _mesajService = mesajService;
        _kullaniciService = kullaniciService;
        _hubContext = hubContext;
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
    public async Task<IActionResult> MesajGonder([FromBody] Mesaj yeniMesaj) 
    {
        try
        {
           
            _mesajService.MesajGonder(yeniMesaj);

          
            var tumKullanicilar = _kullaniciService.TumKullanicilariGetir();
            var gonderenKisi = tumKullanicilar.FirstOrDefault(k => k.Id == yeniMesaj.gonderenid);
            var gonderenAd = gonderenKisi != null ? gonderenKisi.AdSoyad : "Bilinmeyen";

            var yayinlanacakMesaj = new {
                id = yeniMesaj.id,
                sohbetid = yeniMesaj.sohbetid,
                gonderenid = yeniMesaj.gonderenid,
                icerik = yeniMesaj.icerik,
                gondermeTarihi = yeniMesaj.gondermeTarihi,
                gonderenAd = gonderenAd // İsim bilgisini de SignalR ile yolluyoruz ki ekrana yazılabilsin
            };

            
            await _hubContext.Clients.All.SendAsync("YeniMesajGeldi", yayinlanacakMesaj);

            return Ok("Mesaj başarıyla gönderildi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}