using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;
using System.Linq; 
using STAJ1.Repositories;

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/sohbetler")]
public class ChatController : ControllerBase
{
    private readonly IChatService _sohbetService;
    private readonly IUserService _kullaniciService; 
    private readonly IGenericRepository<ChatMember> _katilimciRepo; 
    private readonly IGenericRepository<Message> _mesajRepo;

    public ChatController(
        IChatService sohbetService, 
        IUserService kullaniciService, 
        IGenericRepository<ChatMember> katilimciRepo,
        IGenericRepository<Message> mesajRepo)
    {
        _sohbetService = sohbetService;
        _kullaniciService = kullaniciService;
        _katilimciRepo = katilimciRepo;
        _mesajRepo = mesajRepo;
    }

    [HttpPost("olustur")]
    public IActionResult CreateChat([FromBody] Chat yeniSohbet)
    {
        try
        {
            var olusturulanSohbet = _sohbetService.CreateChat(yeniSohbet);
            return Ok(olusturulanSohbet);
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpPost("{sohbetId}/kullanici-ekle/{kullaniciId}")]
    public IActionResult AddUser(int sohbetId, int kullaniciId)
    {
        try
        {
            _sohbetService.AddUserToChat(sohbetId, kullaniciId);
            return Ok("Kullanıcı sohbete başarıyla eklendi.");
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpPost("grup-olustur")]
    public IActionResult CreateGroupChat([FromBody] YeniGrupRequest request)
    {
        try
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized("Kullanıcı kimliği bulunamadı.");
            var olusturanKullaniciId = int.Parse(userIdString);

            var yeniSohbet = new Chat
            {
                grupadi = request.GrupAdi, 
                grupmu = true,
                olusturmaTarihi = DateTime.Now
            };

            var olusturulanSohbet = _sohbetService.CreateChat(yeniSohbet);

            if (!request.KatilimciIdleri.Contains(olusturanKullaniciId))
            {
                request.KatilimciIdleri.Add(olusturanKullaniciId);
            }

            foreach (var kullaniciId in request.KatilimciIdleri)
            {
                _sohbetService.AddUserToChat(olusturulanSohbet.id, kullaniciId);
            }

            return Ok(new { mesaj = "Grup başarıyla oluşturuldu!", sohbetId = olusturulanSohbet.id });
        }
        catch (Exception ex)
        {
            return BadRequest("Hata: " + ex.Message);
        }
    }

    // ========================================================================
    // SOHBET LİSTESİNDE DİNAMİK İSİMLENDİRME
    // ========================================================================
    [HttpGet("kullanici/{kullaniciId}")]
    public IActionResult UsersChat(int kullaniciId)
    {
        try
        {
            var sohbetler = _sohbetService.GetUsersChat(kullaniciId);
            var tumKatilimcilar = _katilimciRepo.GetAll();
            var tumKullanicilar = _kullaniciService.GetAllUsers();
            var tumMesajlar = _mesajRepo.GetAll(); 

            var dinamikSohbetListesi = sohbetler.Select(s => 
            {
                string ekranaYazilacakAd = s.grupadi; 

                if (!s.grupmu) 
                {
                    var digerKisininKaydi = tumKatilimcilar.FirstOrDefault(k => k.sohbetid == s.id && k.kullaniciid != kullaniciId);
                    if (digerKisininKaydi != null)
                    {
                        var digerKullanici = tumKullanicilar.FirstOrDefault(u => u.Id == digerKisininKaydi.kullaniciid);
                        if (digerKullanici != null) ekranaYazilacakAd = digerKullanici.AdSoyad; 
                    }
                }

                var kullanicininKatilimKaydi = tumKatilimcilar.FirstOrDefault(k => k.sohbetid == s.id && k.kullaniciid == kullaniciId);
                DateTime? sonOkuma = kullanicininKatilimKaydi?.SonOkumaTarihi;
                
                var buSohbetinMesajlari = tumMesajlar.Where(m => m.sohbetid == s.id).OrderByDescending(m => m.gondermeTarihi).ToList();
                var sonMesaj = buSohbetinMesajlari.FirstOrDefault();

                int okunmamisSayisi = buSohbetinMesajlari
                    .Count(m => m.gonderenid != kullaniciId && (sonOkuma == null || m.gondermeTarihi > sonOkuma));
                
                string sonMesajGonderen = "";
                string onizlemeMetni = "Henüz mesaj yok...";

                if (sonMesaj != null) 
                {
                     if (s.grupmu) 
                     {
                         sonMesajGonderen = tumKullanicilar.FirstOrDefault(u => u.Id == sonMesaj.gonderenid)?.AdSoyad ?? "";
                     }
                     
                     onizlemeMetni = !string.IsNullOrWhiteSpace(sonMesaj.icerik) 
                                     ? sonMesaj.icerik 
                                     : "📁 Dosya gönderildi";
                }

                return new 
                {
                    id = s.id,
                    grupmu = s.grupmu,
                    grupadi = ekranaYazilacakAd, 
                    olusturmaTarihi = s.olusturmaTarihi,
                    okunmamisMesajSayisi = okunmamisSayisi,
                    sonMesajIcerik = onizlemeMetni,
                    sonMesajTarihi = sonMesaj != null ? sonMesaj.gondermeTarihi : s.olusturmaTarihi,
                    sonMesajGonderenAd = sonMesajGonderen,
                    // YENİ EKLENEN SATIR: JS'e bu mesajı kimin attığını ID olarak söylüyoruz
                    sonMesajGonderenId = sonMesaj != null ? sonMesaj.gonderenid : 0 
                };
            })
            .OrderByDescending(x => x.sonMesajTarihi) 
            .ToList();

            return Ok(dinamikSohbetListesi);
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Hata: {gercekHata}");
        }
    }
    [HttpGet("{sohbetId}/katilimcilar")]
    public IActionResult GetUsersInChat(int sohbetId)
    {
        try
        {
            var katilimciKayitlari = _katilimciRepo.GetAll().Where(k => k.sohbetid == sohbetId).ToList();
            var tumKullanicilar = _kullaniciService.GetAllUsers();

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
    
[HttpPost("{sohbetId}/okundu-isaretle")]
public IActionResult MarkAsRead(int sohbetId)
{
    try
    {
        // 1. ÇÖZÜM: ID'yi hem NameIdentifier'da hem de "sub" içinde arıyoruz
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdString)) 
            return Unauthorized("Kullanıcı kimliği doğrulanamadı.");
            
        var kullaniciId = int.Parse(userIdString);

        var katilimci = _katilimciRepo.GetAll()
            .FirstOrDefault(k => k.sohbetid == sohbetId && k.kullaniciid == kullaniciId);

        if (katilimci != null)
        {
            
            katilimci.SonOkumaTarihi = DateTime.Now;
            
            _katilimciRepo.Update(katilimci); 
            return Ok();
        }
        return BadRequest("Kullanıcı bu sohbette değil.");
    }
   catch (Exception ex)
    {
      
        var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
        return BadRequest($"GERÇEK HATA: {gercekHata}");
    }
}
[HttpGet("ara")]
    public IActionResult Search([FromQuery] string kelime)
    {
        try
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
            var kullaniciId = int.Parse(userIdString);

            if (string.IsNullOrWhiteSpace(kelime) || kelime.Length < 2)
                return BadRequest("Arama kelimesi en az 2 karakter olmalıdır.");

            kelime = kelime.ToLower();

            
            var kullanicininSohbetIdleri = _katilimciRepo.GetAll()
                .Where(k => k.kullaniciid == kullaniciId).Select(k => k.sohbetid).ToList();

            var sohbetler = _sohbetService.GetUsersChat(kullaniciId)
                .Where(s => (s.grupadi != null && s.grupadi.ToLower().Contains(kelime)))
                .Select(s => new { id = s.id, ad = s.grupadi, tur = "sohbet" }).ToList();

        
            var kisiler = _kullaniciService.GetAllUsers()
                .Where(k => k.Id != kullaniciId && k.AdSoyad.ToLower().Contains(kelime))
                .Select(k => new { id = k.Id, ad = k.AdSoyad, tur = "kisi" }).ToList();

         
            var mesajlar = _mesajRepo.GetAll()
                .Where(m => kullanicininSohbetIdleri.Contains(m.sohbetid) && 
                            m.icerik != null && m.icerik.ToLower().Contains(kelime))
                .Select(m => new 
                { 
                    id = m.id, 
                    sohbetId = m.sohbetid, 
                    icerik = m.icerik, 
                    gondermeTarihi = m.gondermeTarihi 
                })
                .OrderByDescending(m => m.gondermeTarihi)
                .ToList();

            return Ok(new 
            {
                sohbetler = sohbetler,
                kisiler = kisiler,
                mesajlar = mesajlar
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Arama Hatası: {ex.Message}");
        }
    }
    [HttpPost("birebir/{hedefKullaniciId}")]
    public IActionResult GetOrCreatePrivateChat(int hedefKullaniciId)
    {
        try
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
            var benimId = int.Parse(userIdString);

            if (benimId == hedefKullaniciId) 
                return BadRequest("Kendinizle sohbet başlatamazsınız.");

            // iki kişi arasında birebir sohbet var mı?
            var tumSohbetler = _sohbetService.GetUsersChat(benimId).Where(s => !s.grupmu).ToList();
            var tumKatilimcilar = _katilimciRepo.GetAll();

            foreach (var sohbet in tumSohbetler)
            {
                var digerKisininKaydi = tumKatilimcilar.FirstOrDefault(k => k.sohbetid == sohbet.id && k.kullaniciid == hedefKullaniciId);
                if (digerKisininKaydi != null)
                {
                    // Zaten sohbet var, yeni oluşturmadan mevcut ID
                    return Ok(new { mesaj = "Sohbet zaten var.", sohbetId = sohbet.id, yeniMi = false });
                }
            }

            // Yoksa yeni bir birebir sohbet oluştur
            var yeniSohbet = new Chat { grupmu = false, olusturmaTarihi = DateTime.Now };
            var olusturulan = _sohbetService.CreateChat(yeniSohbet);

            _sohbetService.AddUserToChat(olusturulan.id, benimId);
            _sohbetService.AddUserToChat(olusturulan.id, hedefKullaniciId);

            return Ok(new { mesaj = "Yeni sohbet oluşturuldu.", sohbetId = olusturulan.id, yeniMi = true });
        }
        catch (Exception ex)
        {
            return BadRequest($"Hata: {ex.Message}");
        }
    }
}