using System.Collections.Generic;
using System.Linq;
using STAJ1.Models;
using STAJ1.Repositories;

namespace STAJ1.Services;

public class MesajService : IMesajService
{
    private readonly IGenericRepository<Mesaj> _mesajRepository;

    public MesajService(IGenericRepository<Mesaj> mesajRepository)
    {
        _mesajRepository = mesajRepository;
    }

    public IEnumerable<Mesaj> SohbeteAitMesajlariGetir(int sohbetId)
    {
        // Mesajları Repository üzerinden filtreleyerek çekiyoruz
        
        return _mesajRepository.HepsiniGetir()
                               .Where(m => m.sohbetid == sohbetId)
                               .ToList();
    }

    public void MesajGonder(Mesaj yeniMesaj)
    {
        // İleride buraya "Bu kullanıcı bu sohbette var mı?" gibi iş kuralları eklenecek
        _mesajRepository.Ekle(yeniMesaj);
    }
}