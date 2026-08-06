using System.Collections.Generic;
using System.Linq;
using STAJ1.Models;
using STAJ1.Repositories;

namespace STAJ1.Services;

public class MessageService : IMessageService
{
    private readonly IGenericRepository<Message> _mesajRepository;

    public MessageService(IGenericRepository<Message> mesajRepository)
    {
        _mesajRepository = mesajRepository;
    }

    public IEnumerable<Message> GetMessageByChatId(int sohbetId)
    {
        // Mesajları Repository üzerinden filtreleyerek çekiyoruz
        
        return _mesajRepository.GetAll()
                               .Where(m => m.sohbetid == sohbetId)
                               .ToList();
    }

    public void SendMessage(Message yeniMesaj)
    {
        // İleride buraya "Bu kullanıcı bu sohbette var mı?" gibi iş kuralları eklenecek
        _mesajRepository.Add(yeniMesaj);
    }
    public bool IsUserInChat(int sohbetId, int kullaniciId)
{
    return _mesajRepository.GetAll().Any(m => m.sohbetid == sohbetId && m.gonderenid == kullaniciId);
}
}