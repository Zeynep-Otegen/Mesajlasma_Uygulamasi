using System;
using STAJ1.Models;
using STAJ1.Repositories;
using STAJ1.Helpers;
using STAJ1.Data;

namespace STAJ1.Services;

public class AuthService : IAuthService
{
    private readonly IGenericRepository<User> _repository;
    private readonly UygulamaDbContext _context; // Rolleri Join ile çekmek için ekledik

    public AuthService(IGenericRepository<User> repository, UygulamaDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public void Register(User yeniKullanici)
    {
        var mevcutKullanici = _repository.Get(k => k.Eposta == yeniKullanici.Eposta);
        if (mevcutKullanici != null)
        {
            throw new Exception("Bu e-posta adresi zaten kayıtlı!");
        }

        yeniKullanici.SifreHash = PasswordHasher.HashPassword(yeniKullanici.SifreHash);
        _repository.Add(yeniKullanici);
    }

    public (User kullanici, List<string> roller) Login(LoginRequest request)
    {
        var kullanici = _repository.Get(k => k.Eposta == request.Eposta);
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