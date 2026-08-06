using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; 
using Microsoft.AspNetCore.SignalR; 
using STAJ1.Hubs;
using System.Threading.Tasks; 

namespace STAJ1.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class MessageController : ControllerBase
{
    private readonly IMessageService _mesajService;
    private readonly IUserService _kullaniciService; 
    private readonly IHubContext<ChatHub> _hubContext;

    public MessageController(IMessageService mesajService, IUserService kullaniciService, IHubContext<ChatHub> hubContext)
    {
        _mesajService = mesajService;
        _kullaniciService = kullaniciService;
        _hubContext = hubContext;
    }

    [HttpGet("sohbet/{sohbetId}")]
    public IActionResult GetMessageByChatId(int sohbetId)
    {
        try
        {
            
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    
            int aktifKullaniciId = int.Parse(userIdClaim);

            
            bool yetkisiVarMi = _mesajService.IsUserInChat(sohbetId, aktifKullaniciId);

            if (!yetkisiVarMi)
            {
                // Yetkisi yoksa 403 Forbidden döndür
                return StatusCode(403, "Erişim Reddedildi: Bu sohbetin bir üyesi değilsiniz.");
            }

            var mesajlar = _mesajService.GetMessageByChatId(sohbetId);
            var tumKullanicilar = _kullaniciService.GetAllUsers();

            var mesajListesi = mesajlar.Select(m => new
            {
                m.id,
                m.sohbetid,
                gonderenid = m.gonderenid,
                icerik = m.icerik,
                gondermeTarihi = m.gondermeTarihi,
                dosyaYolu = m.DosyaYolu, 
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
    public async Task<IActionResult> SendMessage([FromBody] Message yeniMesaj) 
    {
        
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            
            int aktifKullaniciId = int.Parse(userIdClaim);
            bool yetkisiVarMi = _mesajService.IsUserInChat(yeniMesaj.sohbetid, aktifKullaniciId);

            if (!yetkisiVarMi)
            {
                return StatusCode(403, "Erişim Reddedildi: Bu sohbete mesaj gönderemezsiniz.");
            }
            
            yeniMesaj.gondermeTarihi = DateTime.Now;
            // Veritabanına kaydetmesi için Servis katmanına gönderiliyor
            _mesajService.SendMessage(yeniMesaj);

            var tumKullanicilar = _kullaniciService.GetAllUsers();
            var gonderenKisi = tumKullanicilar.FirstOrDefault(k => k.Id == yeniMesaj.gonderenid);
            var gonderenAd = gonderenKisi != null ? gonderenKisi.AdSoyad : "Bilinmeyen";

            var yayinlanacakMesaj = new {
                id = yeniMesaj.id,
                sohbetid = yeniMesaj.sohbetid,
                gonderenid = yeniMesaj.gonderenid,
                icerik = yeniMesaj.icerik,
                gondermeTarihi = yeniMesaj.gondermeTarihi,
                dosyaYolu = yeniMesaj.DosyaYolu, 
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