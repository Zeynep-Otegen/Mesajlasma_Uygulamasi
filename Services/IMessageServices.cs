using System.Collections.Generic;
using STAJ1.Models;

namespace STAJ1.Services;

public interface IMesajService
{
    // Belirli bir sohbete ait tüm mesajları getirecek metot
    IEnumerable<Mesaj> SohbeteAitMesajlariGetir(int sohbetId);
    
    // Yeni mesaj gönderme işlemi için metot
    void MesajGonder(Mesaj yeniMesaj);
}