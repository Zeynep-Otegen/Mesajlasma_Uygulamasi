using System.Collections.Generic;
using STAJ1.Models;

namespace STAJ1.Services;

public interface ISohbetService
{
    // Yeni bir sohbet oluşturur ve oluşturulan sohbeti döndürür
    Sohbet SohbetOlustur(Sohbet yeniSohbet);
    
    // Sohbete kullanıcı ekler (sohbetkatilimcilar tablosu)
    void KullaniciyiSohbeteEkle(int sohbetId, int kullaniciId);
    
    // Bir kullanıcının dahil olduğu tüm sohbetleri listeler
    IEnumerable<Sohbet> KullanicininSohbetleriniGetir(int kullaniciId);
}