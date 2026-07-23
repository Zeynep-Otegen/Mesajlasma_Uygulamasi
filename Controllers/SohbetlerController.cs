using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;

namespace STAJ1.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SohbetlerController : ControllerBase
{
    private readonly ISohbetService _sohbetService;

    public SohbetlerController(ISohbetService sohbetService)
    {
        _sohbetService = sohbetService;
    }

    [HttpPost("olustur")]
    public IActionResult SohbetOlustur([FromBody] Sohbet yeniSohbet)
    {
        try
        {
            var olusturulanSohbet = _sohbetService.SohbetOlustur(yeniSohbet);
            return Ok(olusturulanSohbet);
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpPost("{sohbetId}/kullanici-ekle/{kullaniciId}")]
    public IActionResult KullaniciEkle(int sohbetId, int kullaniciId)
    {
        try
        {
            _sohbetService.KullaniciyiSohbeteEkle(sohbetId, kullaniciId);
            return Ok("Kullanıcı sohbete başarıyla eklendi.");
        }
        catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Veritabanı Hatası: {gercekHata}");
        }
    }

    [HttpGet("kullanici/{kullaniciId}")]
    public IActionResult KullanicininSohbetleri(int kullaniciId)
    {
        try
        {
            var sohbetler = _sohbetService.KullanicininSohbetleriniGetir(kullaniciId);
            return Ok(sohbetler);
        }
      catch (Exception ex)
        {
            var gercekHata = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
            return BadRequest($"Hata: {gercekHata}");
        }
    }
}