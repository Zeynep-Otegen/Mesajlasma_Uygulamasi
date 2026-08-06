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
    private readonly IMessageService _mesajService;
    private readonly IUserService _kullaniciService; 
    private readonly IRedisService _redisService; 

    // Constructor güncellendi
    public ChatHub(IMessageService mesajService, IUserService kullaniciService, IRedisService redisService)
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
                _kullaniciService.UpdateStatus(userId, true);
                
                // 2. REDİS: RAM'e yazmayı dene
                _redisService.SetUserOnline(userId);
                
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
                _kullaniciService.UpdateStatus(userId, false);
                
                // 2. REDİS: RAM'den silmeyi dene
                _redisService.SetUserOffline(userId);
                
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

    public async Task JoinChat(int sohbetId)
{
    // İstek atan kişi ID al
    var userIdString = Context.UserIdentifier; 
    
    if (string.IsNullOrEmpty(userIdString)) 
    {
        return; // Kimliksiz girişleri reddet
    }

    int aktifKullaniciId = int.Parse(userIdString);

    //sohbette var mı?
    
    bool yetkisiVarMi = _mesajService.IsUserInChat(sohbetId, aktifKullaniciId);

    if (!yetkisiVarMi)
    {
        //Bağlantıyı Drop et
        return; 
    }

    //Yetkisi varsa SignalR dinleyici grubuna dahil et
    await Groups.AddToGroupAsync(Context.ConnectionId, sohbetId.ToString());
}
    
    public async Task SendMessage(int sohbetId, int gonderenId, string gonderenAd, string mesajIcerigi)
    {
        var yeniMesaj = new Message
        {
            sohbetid = sohbetId,
            gonderenid = gonderenId,
            icerik = mesajIcerigi
        };

        _mesajService.SendMessage(yeniMesaj);

        string odaAdi = sohbetId.ToString();
        await Clients.Group(odaAdi).SendAsync("YeniMesajAlindi", gonderenAd, mesajIcerigi);
    }
}