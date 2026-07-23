using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using STAJ1.Models;
using STAJ1.Services;
using System.Threading.Tasks;

namespace STAJ1.Hubs;
[Authorize] // Bu hub'a erişim için kullanıcıların giriş yapmış olması gerekiyor
public class ChatHub : Hub
{
    private readonly IMesajService _mesajService;

    // Dependency Injection ile mesaj servisimizi Hub'ın içine alıyoruz
    public ChatHub(IMesajService mesajService)
    {
        _mesajService = mesajService;
    }

public async Task OdayaKatil(int sohbetId)
    {
        // Grup isimleri string olmak zorundadır, bu yüzden ID'yi stringe çeviriyoruz
        string odaAdi = sohbetId.ToString();
        await Groups.AddToGroupAsync(Context.ConnectionId, odaAdi);
    }
    // Metot parametrelerini güncelledik: Artık veritabanı için Id bilgileri de geliyor
    public async Task MesajGonder(int sohbetId, int gonderenId, string gonderenAd, string mesajIcerigi)
    {
        // 1. Veritabanına kaydetmek için yeni mesaj nesnesini oluşturuyoruz
        var yeniMesaj = new Mesaj
        {
            sohbetid = sohbetId,
            gonderenid = gonderenId,
            icerik = mesajIcerigi
        };

        // 2. Servis üzerinden PostgreSQL'e kalıcı olarak kaydediyoruz
        _mesajService.MesajGonder(yeniMesaj);

//3.İlgili sohbet id ye mesaj gitmeli
      string odaAdi = sohbetId.ToString();
        await Clients.Group(odaAdi).SendAsync("YeniMesajAlindi", gonderenAd, mesajIcerigi);
    }
}