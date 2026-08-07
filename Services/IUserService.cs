using STAJ1.Models;

namespace STAJ1.Services;

public interface IUserService
{
    List<User> GetAllUsers();
    User? GetById(int id);
    void AddUser(User kullanici);
    void UpdateUser(int id, User guncelKullanici);
    void DeleteUser(int id);
    void UpdateStatus(int kullaniciId, bool cevrimiciMi);
}