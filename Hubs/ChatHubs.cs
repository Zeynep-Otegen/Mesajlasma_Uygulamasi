using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Security.Claims; // Token'dan ID okumak için gerekli
using System.Threading.Tasks;

namespace STAJ1.Hubs;

[Authorize] 
public class ChatHub : Hub
{
    private readonly IMesajService _mesajService;
    private readonly IKullaniciService _kullaniciService; 

    
    public ChatHub(IMesajService mesajService, IKullaniciService kullaniciService)
    {
        _mesajService = mesajService;
        _kullaniciService = kullaniciService;
    }

    // =================================================================
    // KULLANICI UYGULAMAYA GİRDİĞİNDE
    // =================================================================
    public override async Task OnConnectedAsync()
    {
        // Token'dan giriş yapan kişinin ID'si
        var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? Context.User?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out int userId))
        {
            // Veritabanında Çevrimiçi (true) 
            _kullaniciService.DurumGuncelle(userId, true);

            
            await Clients.Others.SendAsync("KullaniciDurumDegisti", userId, true);
        }

        await base.OnConnectedAsync();
    }

    // =================================================================
    // KULLANICI TARAYICIYI/SEKMEYİ KAPATTIĞINDA
    // =================================================================
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? Context.User?.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userIdString) && int.TryParse(userIdString, out int userId))
        {
            // Veritabanında Çevrimdışı (false) yap 
            _kullaniciService.DurumGuncelle(userId, false);

            
            await Clients.Others.SendAsync("KullaniciDurumDegisti", userId, false);
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