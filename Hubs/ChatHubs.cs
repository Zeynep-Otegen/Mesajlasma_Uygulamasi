using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STAJ1.Hubs;

[Authorize] 
public class ChatHub : Hub
{
    private readonly IMesajService _mesajService;
    private readonly IKullaniciService _kullaniciService; 
    private readonly IRedisService _redisService; 

    // Constructor güncellendi
    public ChatHub(IMesajService mesajService, IKullaniciService kullaniciService, IRedisService redisService)
    {
        _mesajService = mesajService;
        _kullaniciService = kullaniciService;
        _redisService = redisService;
    }

    // =================================================================
    // KULLANICI UYGULAMAYA GİRDİĞİNDE
    // =================================================================
    public override async Task OnConnectedAsync()
    {
        try 
        {
            var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                            ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out int userId))
            {
                // 1. YEDEKLEME: Eski DB kodunu her ihtimale karşı çalıştır
                _kullaniciService.DurumGuncelle(userId, true);
                
                // 2. REDİS: RAM'e yazmayı dene
                _redisService.KullaniciCevrimiciYap(userId);
                
                // 3. BİLDİRİM: Diğer kullanıcılara haber ver
                await Clients.Others.SendAsync("KullaniciDurumDegisti", userId, true);
            }
        }
        catch (Exception ex)
        {
            // Redis'e ulaşılamazsa hatayı konsola yaz, ancak SignalR'ı ÇÖKERTME!
            Console.WriteLine($"[SignalR Bağlantı Hatası]: {ex.Message}");
        }

        await base.OnConnectedAsync();
    }

    // =================================================================
    // KULLANICI TARAYICIYI/SEKMEYİ KAPATTIĞINDA
    // =================================================================
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try 
        {
            var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                            ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out int userId))
            {
                // 1. YEDEKLEME: Eski DB kodunu her ihtimale karşı çalıştır
                _kullaniciService.DurumGuncelle(userId, false);
                
                // 2. REDİS: RAM'den silmeyi dene
                _redisService.KullaniciCevrimdisiYap(userId);
                
                // 3. BİLDİRİM: Diğer kullanıcılara haber ver
                await Clients.Others.SendAsync("KullaniciDurumDegisti", userId, false);
            }
        }
        catch (Exception ex)
        {
            // Redis'e ulaşılamazsa hatayı konsola yaz, ancak SignalR'ı ÇÖKERTME!
            Console.WriteLine($"[SignalR Kopma Hatası]: {ex.Message}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task OdayaKatil(int sohbetId)
    {
        string odaAdi = sohbetId.ToString();
        await Groups.AddToGroupAsync(Context.ConnectionId, odaAdi);
    }
    
    public async Task MesajGonder(int sohbetId, int gonderenId, string gonderenAd, string mesajIcerigi)
    {
        var yeniMesaj = new Mesaj
        {
            sohbetid = sohbetId,
            gonderenid = gonderenId,
            icerik = mesajIcerigi
        };

        _mesajService.MesajGonder(yeniMesaj);

        string odaAdi = sohbetId.ToString();
        await Clients.Group(odaAdi).SendAsync("YeniMesajAlindi", gonderenAd, mesajIcerigi);
    }
}