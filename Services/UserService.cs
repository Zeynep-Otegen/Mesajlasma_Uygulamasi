using System;
using System.Collections.Generic;
using STAJ1.Models;
using STAJ1.Repositories;

namespace STAJ1.Services;

public class UserService : IUserService
{
    
    private readonly IGenericRepository<User> _repository;

    public UserService(IGenericRepository<User> repository)
    {
        _repository = repository;
    }

    public List<User> GetAllUsers()
    {
        return _repository.GetAll();
    }

    public User? GetById(int id)
    {
        return _repository.GetById(id);
    }

    public void AddUser(User kullanici)
    {
        // YENİ SİSTEM: E-posta kontrolünü yeni yazdığımız Şartlı Arama metoduyla yapıyoruz
        var mevcutKullanici = _repository.Get(k => k.Eposta == kullanici.Eposta);
        
        if (mevcutKullanici != null)
        {
            throw new Exception("Bu e-posta adresi zaten kullanılıyor!");
        }

        _repository.Add(kullanici);
    }

    public void UpdateUser(int id, User guncelKullanici)
    {
        var mevcutKullanici = _repository.GetById(id);
        if (mevcutKullanici == null)
        {
            throw new Exception("Güncellenmek istenen kullanıcı bulunamadı!");
        }

        mevcutKullanici.AdSoyad = guncelKullanici.AdSoyad;
        mevcutKullanici.Eposta = guncelKullanici.Eposta;
        mevcutKullanici.SifreHash = guncelKullanici.SifreHash;

        _repository.Update(mevcutKullanici);
    }

    public void DeleteUser(int id)
    {
        var mevcutKullanici = _repository.GetById(id);
        if (mevcutKullanici == null)
        {
            throw new Exception("Silinmek istenen kullanıcı bulunamadı!");
        }

        _repository.Delete(id);
    }
    public void UpdateStatus(int kullaniciId, bool cevrimiciMi)
{
    var kullanici = _repository.GetById(kullaniciId); 
    if (kullanici != null)
    {
        kullanici.CevrimiciMi = cevrimiciMi;
        
        if (!cevrimiciMi) 
        {
            
            kullanici.SonGorulme = DateTime.UtcNow; 
        }
        
        _repository.Update(kullanici); 
    }
}
}