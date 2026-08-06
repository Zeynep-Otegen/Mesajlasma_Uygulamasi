using System.Collections.Generic;
using STAJ1.Models;

namespace STAJ1.Services;

public interface IChatService
{
    // Yeni bir sohbet oluşturur ve oluşturulan sohbeti döndürür
    Chat CreateChat(Chat yeniSohbet);
    
    // Sohbete kullanıcı ekler (sohbetkatilimcilar tablosu)
    void AddUserToChat(int sohbetId, int kullaniciId);
    
    // Bir kullanıcının dahil olduğu tüm sohbetleri listeler
    IEnumerable<Chat> GetUsersChat(int kullaniciId);
}