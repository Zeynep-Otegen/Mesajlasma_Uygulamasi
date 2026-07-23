using System;
using System.Collections.Generic;
using STAJ1.Models;
using STAJ1.Repositories;

namespace STAJ1.Services;

public class KullaniciService : IKullaniciService
{
    // Artık IKullaniciRepository yerine IGenericRepository<Kullanici> kullanıyoruz
    private readonly IGenericRepository<Kullanici> _repository;

    public KullaniciService(IGenericRepository<Kullanici> repository)
    {
        _repository = repository;
    }

    public List<Kullanici> TumKullanicilariGetir()
    {
        return _repository.HepsiniGetir();
    }

    public Kullanici? IdyeGoreGetir(int id)
    {
        return _repository.IdyeGoreGetir(id);
    }

    public void KullaniciEkle(Kullanici kullanici)
    {
        // YENİ SİSTEM: E-posta kontrolünü yeni yazdığımız Şartlı Arama metoduyla yapıyoruz
        var mevcutKullanici = _repository.SartaGoreGetir(k => k.Eposta == kullanici.Eposta);
        
        if (mevcutKullanici != null)
        {
            throw new Exception("Bu e-posta adresi zaten kullanılıyor!");
        }

        _repository.Ekle(kullanici);
    }

    public void KullaniciGuncelle(int id, Kullanici guncelKullanici)
    {
        var mevcutKullanici = _repository.IdyeGoreGetir(id);
        if (mevcutKullanici == null)
        {
            throw new Exception("Güncellenmek istenen kullanıcı bulunamadı!");
        }

        mevcutKullanici.AdSoyad = guncelKullanici.AdSoyad;
        mevcutKullanici.Eposta = guncelKullanici.Eposta;
        mevcutKullanici.SifreHash = guncelKullanici.SifreHash;

        _repository.Guncelle(mevcutKullanici);
    }

    public void KullaniciSil(int id)
    {
        var mevcutKullanici = _repository.IdyeGoreGetir(id);
        if (mevcutKullanici == null)
        {
            throw new Exception("Silinmek istenen kullanıcı bulunamadı!");
        }

        _repository.Sil(id);
    }
}