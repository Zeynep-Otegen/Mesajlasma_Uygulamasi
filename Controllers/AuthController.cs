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
    private readonly IGenericRepository<Kullanicilog> _logRepository;

    // Her iki servisi de Controller'a tanıtıyoruz
    public AuthController(IAuthService authService, ITokenService tokenService, IGenericRepository<Kullanicilog> logRepository) 
    {
        _authService = authService;
        _tokenService = tokenService;
        _logRepository = logRepository;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] Kullanici yeniKullanici)
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

            var yeniLog = new Kullanicilog
            {
                KullaniciId = kullanici.Id,
                islemTipi = "Sisteme giriş yapıldı (Login)",
                islemTarihi = DateTime.UtcNow
            };

            _logRepository.Ekle(yeniLog);

            return Ok(new { 
                mesaj = "Giriş başarılı!", 
                token = uretilenToken,
                roller = roller // Test için dönen JSON'da rolleri de görebilirsin
            });
        }
        catch (Exception ex)
        {
          var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            
            // Eğer mesajda "saving the entity" geçiyorsa bu bir veritabanı hatasıdır, 400 dön.
            // Değilse (şifre yanlışsa) 401 dön.
            if (ex.Message.Contains("saving the entity") || ex.InnerException != null)
            {
                return BadRequest($"Veritabanı Hatası: {gercekHata}");
            }
            
            return Unauthorized(ex.Message);
        }
    }
}