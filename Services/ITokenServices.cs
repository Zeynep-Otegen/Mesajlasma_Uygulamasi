using STAJ1.Models;

namespace STAJ1.Services;

public interface ITokenService
{
   string GenerateToken(User kullanici, List<string> roller);
}
