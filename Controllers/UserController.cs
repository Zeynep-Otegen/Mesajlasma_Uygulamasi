using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using STAJ1.Repositories; 
using Microsoft.AspNetCore.Authorization;
using System; 
using System.Linq;

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] 
public class UserController : ControllerBase
{
    private readonly IUserService _kullaniciService;
    private readonly IGenericRepository<UserLog> _logRepository; 
    private readonly IRedisService _redisService; 

    public UserController(
        IUserService kullaniciService, 
        IGenericRepository<UserLog> logRepository,
        IRedisService redisService) 
    {
        _kullaniciService = kullaniciService;
        _logRepository = logRepository;
        _redisService = redisService;
    }

    [Authorize]
    [HttpGet]
    public IActionResult Get()
    {
        // 1. Veritabanından (PostgreSQL) herkesi çek
        var kullanicilar = _kullaniciService.GetAllUsers();
        
        // 2. RAM'den (Redis) sadece online olanların ID listesini çek
        var onlineKullaniciIdleri = _redisService.GetOnlineUsers();

        // 3. Verileri birleştirip (DTO Mantığı) Frontend'e yolla
        var sonuc = kullanicilar.Select(k => new 
        {
            Id = k.Id,
            AdSoyad = k.AdSoyad,
            Eposta = k.Eposta,
            // Eğer kişinin ID'si Redis listesinde varsa TRUE döner
            CevrimiciMi = onlineKullaniciIdleri.Contains(k.Id) 
        }).ToList();

        return Ok(sonuc); 
    }

    [Authorize] 
    [HttpGet("grup-icin-liste")]
    public IActionResult GetUsersByChatId()
    {
        var kullanicilar = _kullaniciService.GetAllUsers()
            .Select(k => new { 
                id = k.Id, 
                adsoyad = k.AdSoyad, 
                eposta = k.Eposta 
            }) 
            .ToList();
            
        return Ok(kullanicilar);
    }

    [HttpPost]
    public IActionResult Add([FromBody] User yeniKullanici)
    {
        try
        {
            _kullaniciService.AddUser(yeniKullanici);
            return Ok("Kullanıcı başarıyla eklendi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message); 
        }
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] User guncelKullanici)
    {
        try
        {
            _kullaniciService.UpdateUser(id, guncelKullanici);

            var yeniLog = new UserLog
            {
                KullaniciId = id,
                islemTipi = "Profil bilgileri güncellendi",
                islemTarihi = DateTime.UtcNow
            };
            _logRepository.Add(yeniLog);

            return Ok("Kullanıcı başarıyla güncellendi ve log kayıtlarına eklendi.");
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _kullaniciService.DeleteUser(id);

            var yeniLog = new UserLog
            {
                KullaniciId = id,
                islemTipi = "Kullanıcı silindi (Hesap Kapatma)",
                islemTarihi = DateTime.UtcNow
            };
            _logRepository.Add(yeniLog);

            return Ok("Kullanıcı başarıyla silindi ve log kayıtlarına eklendi.");
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }
    // SADECE ADMIN ROLÜNE SAHİP OLANLAR GİREBİLİR
[Authorize(Roles = "Admin")] 
[HttpDelete("kullanici-sil/{id}")]
public IActionResult DeleteUser(int id)
{
    // Gerçekte silinmeyecek, kanıtlamak için log kayıdı oluşturacak
    return Ok(new { mesaj = $"{id} numaralı kullanıcı sistemden silindi. (Admin Yetkisi Doğrulandı!)" });
}
}