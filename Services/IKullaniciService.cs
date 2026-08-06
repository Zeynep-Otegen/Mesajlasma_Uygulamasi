using STAJ1.Models;

namespace STAJ1.Services;

public interface IKullaniciService
{
    List<User> TumKullanicilariGetir();
    User? IdyeGoreGetir(int id);
    void KullaniciEkle(User kullanici);
    void KullaniciGuncelle(int id, User guncelKullanici);
    void KullaniciSil(int id);
    void DurumGuncelle(int kullaniciId, bool cevrimiciMi);
}