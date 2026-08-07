using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using STAJ1.Models;

namespace STAJ1.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    // appsettings.json verilerini okuyabilmek için IConfiguration'ı dahil ediyoruz
    public TokenService(IConfiguration config)
    {
        _config = config;
    }

   public string GenerateToken(User kullanici, List<string> roller)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // Temel bilgileri (Claims) oluşturuyoruz (Liste yapısına çevirdik ki dinamik ekleme yapabilelim)
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, kullanici.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, kullanici.Eposta),
            new Claim(JwtRegisteredClaimNames.Name, kullanici.AdSoyad),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Kullanıcının sahip olduğu tüm rolleri Token'a 'Role' tipiyle ekliyoruz
        foreach (var rol in roller)
        {
            claims.Add(new Claim(ClaimTypes.Role, rol));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}