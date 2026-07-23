using System;
using STAJ1.Models;
using STAJ1.Repositories;
using STAJ1.Helpers;
using STAJ1.Data;

namespace STAJ1.Services;

public class AuthService : IAuthService
{
    private readonly IGenericRepository<Kullanici> _repository;
    private readonly UygulamaDbContext _context; // Rolleri Join ile çekmek için ekledik

    public AuthService(IGenericRepository<Kullanici> repository, UygulamaDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public void Register(Kullanici yeniKullanici)
    {
        var mevcutKullanici = _repository.SartaGoreGetir(k => k.Eposta == yeniKullanici.Eposta);
        if (mevcutKullanici != null)
        {
            throw new Exception("Bu e-posta adresi zaten kayıtlı!");
        }

        yeniKullanici.SifreHash = PasswordHasher.HashPassword(yeniKullanici.SifreHash);
        _repository.Ekle(yeniKullanici);
    }

    public (Kullanici kullanici, List<string> roller) Login(LoginRequest request)
    {
        var kullanici = _repository.SartaGoreGetir(k => k.Eposta == request.Eposta);
        if (kullanici == null)
        {
            throw new Exception("E-posta veya şifre hatalı!");
        }

        bool sifreDogruMu = PasswordHasher.VerifyPassword(request.Sifre, kullanici.SifreHash);
        if (!sifreDogruMu)
        {
            throw new Exception("E-posta veya şifre hatalı!");
        }

        // Kullanıcının rollerini ara tablo (Kullanicirol) üzerinden buluyoruz
        var roller = _context.kullaniciroller
            .Where(kr => kr.KullaniciId == kullanici.Id)
            .Select(kr => kr.Rol!.RolAdi)
            .ToList();

        // Tuple olarak hem kullanıcıyı hem rolleri geri döndürüyoruz
        return (kullanici, roller); 
    }
}