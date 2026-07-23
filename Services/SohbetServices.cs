using System.Collections.Generic;
using System.Linq;
using STAJ1.Models;
using STAJ1.Repositories;


namespace STAJ1.Services;

public class SohbetService : ISohbetService
{
    private readonly IGenericRepository<Sohbet> _sohbetRepository;
    private readonly IGenericRepository<SohbetKatilimci> _katilimciRepository;

    public SohbetService(
        IGenericRepository<Sohbet> sohbetRepository, 
        IGenericRepository<SohbetKatilimci> katilimciRepository)
    {
        _sohbetRepository = sohbetRepository;
        _katilimciRepository = katilimciRepository;
    }

    public Sohbet SohbetOlustur(Sohbet yeniSohbet)
    {
        _sohbetRepository.Ekle(yeniSohbet);
        return yeniSohbet; // Eklendikten sonra veritabanından dönen Id ile birlikte
    }

    public void KullaniciyiSohbeteEkle(int sohbetId, int kullaniciId)
    {
        var katilimci = new SohbetKatilimci
        {
            sohbetid = sohbetId,
            kullaniciid = kullaniciId
        };
        _katilimciRepository.Ekle(katilimci);
    }

    public IEnumerable<Sohbet> KullanicininSohbetleriniGetir(int kullaniciId)
    {
        // Kullanıcının bulunduğu sohbet ID'lerini bul
        var kullanicininSohbetIdleri = _katilimciRepository.HepsiniGetir()
            .Where(k => k.kullaniciid == kullaniciId)
            .Select(k => k.sohbetid)
            .ToList();

        // Bu ID'lere sahip sohbetleri getir
        return _sohbetRepository.HepsiniGetir()
            .Where(s => kullanicininSohbetIdleri.Contains(s.id))
            .ToList();
    }
}