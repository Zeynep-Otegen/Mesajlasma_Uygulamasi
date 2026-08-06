using System.Collections.Generic;
using System.Linq;
using STAJ1.Models;
using STAJ1.Repositories;


namespace STAJ1.Services;

public class SohbetService : ISohbetService
{
    private readonly IGenericRepository<Chat> _sohbetRepository;
    private readonly IGenericRepository<ChatMember> _katilimciRepository;

    public SohbetService(
        IGenericRepository<Chat> sohbetRepository, 
        IGenericRepository<ChatMember> katilimciRepository)
    {
        _sohbetRepository = sohbetRepository;
        _katilimciRepository = katilimciRepository;
    }

    public Chat SohbetOlustur(Chat yeniSohbet)
    {
        _sohbetRepository.Add(yeniSohbet);
        return yeniSohbet; // Eklendikten sonra veritabanından dönen Id ile birlikte
    }

    public void KullaniciyiSohbeteEkle(int sohbetId, int kullaniciId)
    {
        var katilimci = new ChatMember
        {
            sohbetid = sohbetId,
            kullaniciid = kullaniciId
        };
        _katilimciRepository.Add(katilimci);
    }

    public IEnumerable<Chat> KullanicininSohbetleriniGetir(int kullaniciId)
    {
        // Kullanıcının bulunduğu sohbet ID'lerini bul
        var kullanicininSohbetIdleri = _katilimciRepository.GetAll()
            .Where(k => k.kullaniciid == kullaniciId)
            .Select(k => k.sohbetid)
            .ToList();

        // Bu ID'lere sahip sohbetleri getir
        return _sohbetRepository.GetAll()
            .Where(s => kullanicininSohbetIdleri.Contains(s.id))
            .ToList();
    }
}