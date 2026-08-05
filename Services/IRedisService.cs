using System.Collections.Generic;

namespace STAJ1.Services
{
    public interface IRedisService
    {
        void KullaniciCevrimiciYap(int kullaniciId);
        void KullaniciCevrimdisiYap(int kullaniciId);
        List<int> CevrimiciKullanicilariGetir();
        bool KullaniciCevrimiciMi(int kullaniciId);
    }
}