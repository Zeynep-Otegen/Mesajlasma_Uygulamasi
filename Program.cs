using STAJ1.Data;
using STAJ1.Repositories;
using STAJ1.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using STAJ1.Hubs;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis; 

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
var builder = WebApplication.CreateBuilder(args);
// Güvenlik maskesini kaldırıp gerçek token verilerini ve hatalarını terminale yazdırması için:
Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;


builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<UygulamaDbContext>(options =>
    options.UseNpgsql(connectionString));


var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];


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
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("\n🚨 DİKKAT! TOKEN REDDEDİLDİ: " + context.Exception.Message);
            return Task.CompletedTask;
        },
        
        OnMessageReceived = context =>
        {
            //Gelen isteğin içindeki Authorization başlığını olduğu gibi yazdırma
            var gelenBaslik = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(gelenBaslik))
            {
                Console.WriteLine("\n🕵️ KAPIYA GELEN TAM METİN: [" + gelenBaslik + "]\n");
            }
            if (context.Request.Cookies.ContainsKey("X-Access-Token"))
            {
                context.Token = context.Request.Cookies["X-Access-Token"];
            }

            // Aşağısı önceden var olan kısımlar (Sohbet ağı için)
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chathub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});


//Dependency Injection (Arayüzeleri ekleme)
// Redis Bağlantısını Uygulamaya Tekil (Singleton) Olarak Tanıtıyoruz
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = builder.Configuration.GetConnectionString("Redis");
    return ConnectionMultiplexer.Connect(configuration);
});


builder.Services.AddScoped<IUserService, UserService>();
// Sisteme Jenerik Kilerimizi tanıtıyoruz:
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<IMessageService, MessageService>();

builder.Services.AddScoped<IChatService, ChatService>();

builder.Services.AddSingleton<IRedisService, RedisService>();

var app = builder.Build();

app.UseAuthentication(); //Önce kimlik kontrolü
app.UseAuthorization();  //Sonra yetki kontrolü

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<STAJ1.Hubs.ChatHub>("/chathub");

app.Run();