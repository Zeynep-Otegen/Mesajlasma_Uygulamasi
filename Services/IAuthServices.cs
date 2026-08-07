using STAJ1.Models;

namespace STAJ1.Services;

public interface IAuthService
{
    void Register(User yeniKullanici);
    
    // Login başarılı olursa geriye Kullanici nesnesini dönsün. 
    // Çünkü JWT (Token) üretirken kullanıcının ID'sine ve E-postasına ihtiyacımız olacak.
   (User kullanici, List<string> roller) Login(LoginRequest request);
}