using StackExchange.Redis;
using System.Collections.Generic;
using System.Linq;

namespace STAJ1.Services
{
    public class RedisService : IRedisService
    {
        private readonly IDatabase _db;
        private const string ONLINE_USERS_KEY = "online_users";

        public RedisService(IConnectionMultiplexer redis)
        {
            // Redis veritabanına bağlanıyoruz
            _db = redis.GetDatabase();
        }

        public void SetUserOnline(int kullaniciId)
        {
            // Kullanıcı ID'sini Redis'teki "online_users" kümesine ekle
            _db.SetAdd(ONLINE_USERS_KEY, kullaniciId);
        }

        public void SetUserOffline(int kullaniciId)
        {
            // Kullanıcı ID'sini kümeden çıkar
            _db.SetRemove(ONLINE_USERS_KEY, kullaniciId);
        }

        public List<int> GetOnlineUsers()
        {
            // Kümedeki tüm ID'leri getir ve List<int> olarak döndür
            var members = _db.SetMembers(ONLINE_USERS_KEY);
            return members.Select(m => (int)m).ToList();
        }

        public bool IsUserOnline(int kullaniciId)
        {
            // Bu ID kümenin içinde var mı diye bak (Çok hızlıdır)
            return _db.SetContains(ONLINE_USERS_KEY, kullaniciId);
        }
    }
}