using STAJ1.Models;

namespace STAJ1.Services;

public interface ITokenService
{
   string GenerateToken(Kullanici kullanici, List<string> roller);
}
