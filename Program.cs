using STAJ1.Data;
using STAJ1.Repositories;
using STAJ1.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using STAJ1.Hubs;
using Microsoft.EntityFrameworkCore; // Veritabanı bağlantısı için eklendi

var builder = WebApplication.CreateBuilder(args);

// 1. Controller (API) sistemini projeye dahil ediyoruz
builder.Services.AddControllers();
builder.Services.AddSignalR();

// VERİTABANI BAĞLANTISI (Gizli appsettings.json dosyasından alınıyor)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<UygulamaDbContext>(options =>
    options.UseNpgsql(connectionString));

// appsettings.json içindeki gizli JWT bilgilerini okuyoruz
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

// Güvenlik görevlisine biletin sahte olup olmadığını nasıl anlayacağını öğretiyoruz
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,          // Biletin kaynağını doğrula
        ValidateAudience = true,        // Biletin hedefini doğrula
        ValidateLifetime = true,        // Biletin süresi dolmuş mu kontrol et
        ValidateIssuerSigningKey = true,// Biletin imzasını (gizli anahtarımızı) doğrula
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!))
    };

    options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                // Eğer istekte token varsa ve adres chathub ise token'ı yakala
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
});


// 2. Kiler ve Aşçı ekibimizi sisteme kaydediyoruz (Dependency Injection)

builder.Services.AddScoped<IKullaniciService, KullaniciService>();
// Sisteme Jenerik Kilerimizi tanıtıyoruz:
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<IMesajService, MesajService>();

builder.Services.AddScoped<ISohbetService, SohbetService>();

var app = builder.Build();

app.UseAuthentication(); // YENİ EKLENEN: Önce kimlik (bilet) kontrolü
app.UseAuthorization();  // ZATEN VARDI: Sonra yetki kontrolü

app.UseStaticFiles();
// Onun yerine Controller sınıflarını otomatik bulup haritalayan bu kodu ekliyoruz:
app.MapControllers();
app.MapHub<STAJ1.Hubs.ChatHub>("/chathub");

app.Run();