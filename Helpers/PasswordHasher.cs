using System;
using System.Text;
using System.Security.Cryptography;
using Konscious.Security.Cryptography;

namespace STAJ1.Helpers;

public static class PasswordHasher
{
    // Şifreyi Argon2id kullanarak hashleme sınıfı
    public static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16); //İki aynı şifre olsa bile farklı hash üretilir, güvenlik için
        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);//Argon2id algoritması metin değil byte dizisi ile çalışır.

        using var argon2 = new Argon2id(passwordBytes) //AMAÇ:Saldırganın işini zorlaştırmak
        {
            Salt = salt,  //hash den önceki byte dizisi
            DegreeOfParallelism = 8, // İşlemci çekirdek kullanımı
            MemorySize = 65536,      // Bellek boyutu (64 MB)
            Iterations = 4           // Döngü sayısı
        };

        byte[] hash = argon2.GetBytes(32);

        // Salt ve Hash değerini tek bir dizi olarak birleştirip saklıyoruz
        byte[] hashBytes = new byte[salt.Length + hash.Length];
        Buffer.BlockCopy(salt, 0, hashBytes, 0, salt.Length);
        Buffer.BlockCopy(hash, 0, hashBytes, salt.Length, hash.Length);

        return Convert.ToBase64String(hashBytes); //Byte dizisini Base64 metine çeviriyor
    }

    // Kullanıcının girdiği şifre ile veritabanındaki hash'i karşılaştırır
    public static bool VerifyPassword(string password, string hashedPassword)
    {
        byte[] hashBytes = Convert.FromBase64String(hashedPassword);

        // İçindeki Salt değerini ayırıyoruz
        byte[] salt = new byte[16];
        Buffer.BlockCopy(hashBytes, 0, salt, 0, 16);

        byte[] passwordBytes = Encoding.UTF8.GetBytes(password);
        using var argon2 = new Argon2id(passwordBytes)
        {
            Salt = salt,
            DegreeOfParallelism = 8,
            MemorySize = 65536,
            Iterations = 4
        };

        byte[] computedHash = argon2.GetBytes(32);

        // Hash'leri güvenli bir şekilde karşılaştırıyoruz
        for (int i = 0; i < 32; i++)
        {
            if (hashBytes[16 + i] != computedHash[i])
                return false;
        }

        return true;
    }
}