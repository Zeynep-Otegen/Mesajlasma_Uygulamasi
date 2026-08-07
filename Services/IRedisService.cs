using System.Collections.Generic;

namespace STAJ1.Services
{
    public interface IRedisService
    {
        void SetUserOnline(int kullaniciId);
        void SetUserOffline(int kullaniciId);
        List<int> GetOnlineUsers();
        bool IsUserOnline(int kullaniciId);
    }
}