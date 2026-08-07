using System.Collections.Generic;
using STAJ1.Models;

namespace STAJ1.Services;

public interface IMessageService
{
   
    IEnumerable<Message> GetMessageByChatId(int sohbetId);
    
    void SendMessage(Message yeniMesaj);
    bool IsUserInChat(int sohbetId, int kullaniciId);
}