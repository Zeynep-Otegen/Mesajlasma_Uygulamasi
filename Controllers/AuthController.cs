using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Repositories;
using STAJ1.Services;
using System;

namespace STAJ1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    private readonly IGenericRepository<UserLog> _logRepository;

    // Her iki servisi de Controller'a tanıtıyoruz
    public AuthController(IAuthService authService, ITokenService tokenService, IGenericRepository<UserLog> logRepository) 
    {
        _authService = authService;
        _tokenService = tokenService;
        _logRepository = logRepository;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] User yeniKullanici)
    {
        try
        {
            _authService.Register(yeniKullanici);
            return Ok("Kayıt işlemi başarıyla gerçekleştirildi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        try
        {
            // 1. İşlem: Kullanıcıyı ve rollerini servisten al (Tuple yapısıyla)
            var (kullanici, roller) = _authService.Login(request);
            
            // 2. İşlem: Doğrulanan kullanıcı ve rolleri için Token üret
            string uretilenToken = _tokenService.GenerateToken(kullanici, roller);

            var yeniLog = new UserLog
            {
                KullaniciId = kullanici.Id,
                islemTipi = "Sisteme giriş yapıldı (Login)",
                islemTarihi = DateTime.UtcNow
            };

            _logRepository.Add(yeniLog);
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true, // JavaScript'in bu çerezi okumasını %100 engeller (XSS Koruması)
                Expires = DateTime.Now.AddHours(2), // Token geçerlilik süresiyle aynı olmalı
                SameSite = SameSiteMode.Lax, // CSRF (Siteler Arası İstek Sahtekarlığı) koruması
                Secure = false // Projeyi canlıya (HTTPS) aldığında bunu 'true' yapmalısın
            };

            // Token'ı şifreli çerez olarak tarayıcıya yapıştırıyoruz
            Response.Cookies.Append("X-Access-Token", uretilenToken, cookieOptions);

            return Ok(new { 
                mesaj = "Giriş başarılı!", 
                kullanici = new {
                    id = kullanici.Id,
                    adSoyad = kullanici.AdSoyad,
                    eposta = kullanici.Eposta,
                    roller = roller
                }
            });
        }
        catch (Exception ex)
        {
          var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            
            if (ex.Message.Contains("saving the entity") || ex.InnerException != null)
            {
                return BadRequest($"Veritabanı Hatası: {gercekHata}");
            }
            
            return Unauthorized(ex.Message);
        
        }
    }
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Sunucu, tarayıcıya çerezi silme emri verir
        Response.Cookies.Delete("X-Access-Token");
        return Ok(new { mesaj = "Başarıyla çıkış yapıldı." });
    }
}