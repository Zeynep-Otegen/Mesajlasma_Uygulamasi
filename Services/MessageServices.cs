using System.Collections.Generic;
using System.Linq;
using STAJ1.Models;
using STAJ1.Repositories;

namespace STAJ1.Services;

public class MessageService : IMessageService
{
    private readonly IGenericRepository<Message> _mesajRepository;
    private readonly IGenericRepository<ChatMember> _katilimciRepository;

    public MessageService(IGenericRepository<Message> mesajRepository, IGenericRepository<ChatMember> katilimciRepository)
    {
        _mesajRepository = mesajRepository;
        _katilimciRepository = katilimciRepository;
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
        // İleride buraya kullanıcı  sohbette var mı gibi iş kuralları eklenecek
        _mesajRepository.Add(yeniMesaj);
    }
    public bool IsUserInChat(int sohbetId, int kullaniciId)
    {
        return _katilimciRepository.GetAll()
                                   .Any(k => k.sohbetid == sohbetId && k.kullaniciid == kullaniciId);
    }
}