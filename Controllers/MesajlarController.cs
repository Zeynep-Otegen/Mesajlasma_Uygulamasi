using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STAJ1.Models;
using STAJ1.Services;
using System;

namespace STAJ1.Controllers;

[Authorize] // SADECE GİRİŞ YAPMIŞ (TOKEN'I OLAN) KULLANICILAR BURAYI KULLANABİLİR
[ApiController]
[Route("api/[controller]")]
public class MesajlarController : ControllerBase
{
    private readonly IMesajService _mesajService;

    public MesajlarController(IMesajService mesajService)
    {
        _mesajService = mesajService;
    }

    // GET: api/mesajlar/sohbet/1
    [HttpGet("sohbet/{sohbetId}")]
    public IActionResult SohbeteAitMesajlariGetir(int sohbetId)
    {
        try
        {
            var mesajlar = _mesajService.SohbeteAitMesajlariGetir(sohbetId);
            return Ok(mesajlar);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // POST: api/mesajlar
    [HttpPost]
    public IActionResult MesajGonder([FromBody] Mesaj yeniMesaj)
    {
        try
        {
            _mesajService.MesajGonder(yeniMesaj);
            return Ok("Mesaj başarıyla gönderildi.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}