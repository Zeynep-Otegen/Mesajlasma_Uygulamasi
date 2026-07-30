using STAJ1.Models;

namespace STAJ1.Services;

public interface IKullaniciService
{
    List<Kullanici> TumKullanicilariGetir();
    Kullanici? IdyeGoreGetir(int id);
    void KullaniciEkle(Kullanici kullanici);
    void KullaniciGuncelle(int id, Kullanici guncelKullanici);
    void KullaniciSil(int id);
    void DurumGuncelle(int kullaniciId, bool cevrimiciMi);
}