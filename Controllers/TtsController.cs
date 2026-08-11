using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace STAJ1.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class TtsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public TtsController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("seslendir")]
    public async Task<IActionResult> Seslendir([FromBody] TtsRequest request)
    {
        //Şifreyi appsettings.json'dan okuma
        var apiKey = _configuration["GoogleTtsApiKey"];
        if (string.IsNullOrEmpty(apiKey)) 
            return StatusCode(500, "API anahtarı bulunamadı.");

        var url = $"https://texttospeech.googleapis.com/v1/text:synthesize?key={apiKey}";

        //Google'ın beklediği format
        var googleRequest = new
        {
            input = new { text = request.Text },
            voice = new { languageCode = request.LanguageCode, name = request.VoiceName },
            audioConfig = new { audioEncoding = "MP3", speakingRate = request.SpeakingRate }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(googleRequest), Encoding.UTF8, "application/json");

        //İsteği Google'a atma ve cevap atama
        var client = _httpClientFactory.CreateClient();
        var response = await client.PostAsync(url, jsonContent);

        if (response.IsSuccessStatusCode)
        {
            var jsonResponse = await response.Content.ReadAsStringAsync();
            // Google'dan gelen Base64 verisini JavaScript'e aynen iletiyoruz
            return Content(jsonResponse, "application/json"); 
        }

        return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
    }
}

// Frontend'den (JS) gelecek verileri tutacak paket (DTO)
public class TtsRequest
{
    public string Text { get; set; } = string.Empty; //Null olamaz uyarısı var.
    public string LanguageCode { get; set; }= string.Empty;
    public string VoiceName { get; set; } = string.Empty;
    public double? SpeakingRate { get; set; }
}