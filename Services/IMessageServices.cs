using System.Collections.Generic;
using STAJ1.Models;

namespace STAJ1.Services;

public interface IMesajService
{
    // Belirli bir sohbete ait tüm mesajları getirecek metot
    IEnumerable<Message> SohbeteAitMesajlariGetir(int sohbetId);
    
    // Yeni mesaj gönderme işlemi için metot
    void MesajGonder(Message yeniMesaj);
    bool KullaniciSohbetteMi(int sohbetId, int kullaniciId);
}