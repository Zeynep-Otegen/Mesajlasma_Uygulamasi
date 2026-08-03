using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; 
using Microsoft.AspNetCore.SignalR; 
using STAJ1.Hubs;
using System.Threading.Tasks; // Task kullanımı için gerekli

namespace STAJ1.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class MesajlarController : ControllerBase
{
    private readonly IMesajService _mesajService;
    private readonly IKullaniciService _kullaniciService; 
    private readonly IHubContext<ChatHub> _hubContext;

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

            var mesajListesi = mesajlar.Select(m => new
            {
                m.id,
                m.sohbetid,
                gonderenid = m.gonderenid,
                icerik = m.icerik,
                gondermeTarihi = m.gondermeTarihi,
                dosyaYolu = m.DosyaYolu, // EKLENDİ: Sayfa yenilendiğinde dosyaların gelmesi için
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
            yeniMesaj.gondermeTarihi = DateTime.Now;
            // Veritabanına kaydetmesi için Servis katmanına gönderiliyor
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
                dosyaYolu = yeniMesaj.DosyaYolu, // EKLENDİ: SignalR ile anlık dosya linkini fırlatmak için
                gonderenAd = gonderenAd 
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