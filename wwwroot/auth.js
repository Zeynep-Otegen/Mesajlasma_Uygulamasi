document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");

    // GİRİŞ YAPMA İŞLEMİ (DÜZELTİLDİ)
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const eposta = document.getElementById("login-email").value;
            const sifre = document.getElementById("login-password").value;
            const errorMsg = document.getElementById("login-error");

            if (!eposta || !sifre) {
                errorMsg.textContent = "Lütfen tüm alanları doldurun.";
                return;
            }

            try {
                // Postman'de attığımız POST isteğinin kod hali
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eposta: eposta, sifre: sifre })
                });

                if (response.ok) {
                    // İŞTE JSON ÇÖZÜMLEMESİ BURADA OLMALI!
                    const data = await response.json(); 
                    
                    // Sadece token'ı alıyoruz
                    const gercekToken = data.token || data.Token; 
                    
                    
                    localStorage.setItem("kullanici", JSON.stringify(data.kullanici));
                    
                    // Giriş başarılı, ana sayfaya yönlendir
                    window.location.href = "index.html";
                } else {
                    const errorText = await response.text();
                    errorMsg.textContent = errorText || "Giriş başarısız. E-posta veya şifre hatalı.";
                }
            } catch (error) {
                errorMsg.textContent = "Sunucuya bağlanılamadı. Backend çalışıyor mu?";
            }
        });
    }

    // KAYIT OLMA İŞLEMİ
    if (registerBtn) {
        registerBtn.addEventListener("click", async () => {
            const adsoyad = document.getElementById("reg-name").value;
            const eposta = document.getElementById("reg-email").value;
            const sifre = document.getElementById("reg-password").value;
            const errorMsg = document.getElementById("reg-error");

            if (!adsoyad || !eposta || !sifre) {
                errorMsg.textContent = "Lütfen tüm alanları doldurun.";
                return;
            }

            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ AdSoyad: adsoyad, Eposta: eposta, SifreHash: sifre })
                });

                if (response.ok) {
                    // Kayıt başarılıysa C# düz metin döner, onu alıp login sayfasına atıyoruz
                    alert("Kayıt Başarılı! Lütfen giriş yapın.");
                    window.location.href = "login.html";
                } else {
                    const errorText = await response.text();
                    errorMsg.textContent = errorText || "Kayıt sırasında bir hata oluştu.";
                }
            } catch (error) {
                errorMsg.textContent = "Sunucuya bağlanılamadı.";
            }
        });
    }
});