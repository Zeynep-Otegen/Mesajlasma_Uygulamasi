document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");
    if (!token) {
        // Token yoksa demek ki giriş yapmamış, logine geri gönder
        window.location.href = "login.html";
        return;
    }

    // Arayüz Elementleri
    const currentUserName = document.getElementById("current-user-name");
    const currentUserEmail = document.getElementById("current-user-email");
    const chatList = document.getElementById("chat-list");
    const logoutBtn = document.getElementById("logout-btn");

    // 1. KİMLİK BİLGİLERİNİ GETİR VE YAZDIR
    async function kullaniciBilgileriniGetir() {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedJson = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const tokenData = JSON.parse(decodedJson);
            console.log("🛠️ TOKEN İÇERİĞİ GELDİ:", tokenData); 

            const isim = tokenData.AdSoyad || tokenData.name || tokenData.unique_name || tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "İsimsiz Kullanıcı";
            const email = tokenData.Eposta || tokenData.email || tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "Email bulunamadı";

            currentUserName.textContent = isim;
            currentUserEmail.textContent = email;

        } catch (error) {
            console.error("Token çözülürken hata:", error);
        }
    }

    // 2. SOHBETLERİ GETİR
    async function sohbetleriGetir() {
        try {
            const temizToken = token.replace(/[^A-Za-z0-9\-_.]/g, "");
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const decodedJson = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const tokenData = JSON.parse(decodedJson);
            
            const kullaniciId = tokenData.sub || tokenData.nameid || tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

            if (!kullaniciId) {
                console.error("Token içinde kullanıcı ID bulunamadı!");
                return;
            }

            console.log(`📡 Sohbetler API'sine istek atılıyor... Hedef: /api/sohbetler/kullanici/${kullaniciId}`);
            
            const response = await fetch(`/api/sohbetler/kullanici/${kullaniciId}`, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + temizToken,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const sohbetler = await response.json();
                chatList.innerHTML = ""; 

                if (sohbetler.length === 0) {
                    chatList.innerHTML = "<p style='padding: 15px; color: #667781; text-align: center; font-size: 14px;'>Henüz hiç sohbet odası yok.</p>";
                    return;
                }

                sohbetler.forEach(sohbet => {
                    const chatItem = document.createElement("div");
                    chatItem.classList.add("chat-item");
                    chatItem.dataset.id = sohbet.id; 

                    chatItem.innerHTML = `
                        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Grup" class="profile-pic">
                        <div class="chat-details">
                            <div class="chat-title">
                                <h4>${sohbet.grupadi || sohbet.grupAdi || sohbet.GrupAdi || "İsimsiz Sohbet"}</h4>
                                <span class="time">-</span>
                            </div>
                            <div class="chat-last-message">
                                <p>Sohbete katılmak için tıklayın...</p>
                            </div>
                        </div>
                    `;
                    chatList.appendChild(chatItem);
                });
            }
        } catch (error) {
            console.error("🚨 Sunucuya bağlanırken hata oluştu:", error);
        }
    }

    // Çıkış Yapma
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        });
    }

    kullaniciBilgileriniGetir();
    sohbetleriGetir();


    // --- YENİ EKLENEN: GRUP OLUŞTURMA VE KİŞİ ARAMA İŞLEMLERİ ---
    const btnYeniGrup = document.getElementById("btn-yeni-grup");
    const grupModal = document.getElementById("grup-modal");
    const btnModalKapat = document.getElementById("modal-kapat");
    const listContainer = document.getElementById("kullanici-listesi");
    const aramaInput = document.getElementById("kisi-ara");
    const btnGrubuKaydet = document.getElementById("btn-grubu-kaydet");
    let tumKullanicilar = []; 

    if (btnYeniGrup) {
        btnYeniGrup.addEventListener("click", async () => {
            grupModal.classList.replace("modal-gizli", "modal-acik");
            await sistemdekiKullanicilariGetir();
        });
    }

    if (btnModalKapat) {
        btnModalKapat.addEventListener("click", () => {
            grupModal.classList.replace("modal-acik", "modal-gizli");
            aramaInput.value = ""; 
        });
    }

   // 1. Kullanıcıları Getiren Fonksiyon (Güncellendi)
    async function sistemdekiKullanicilariGetir() {
        try {
            console.log("📡 Kullanıcı listesi için API'ye istek atılıyor...");
            
            // DİKKAT: Eğer Controller adın KullaniciController ise burayı /api/kullanici/grup-icin-liste yapmalısın.
            const response = await fetch("/api/kullanicilar/grup-icin-liste", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.ok) {
                tumKullanicilar = await response.json();
                console.log("✅ Sunucudan Gelen Kişiler:", tumKullanicilar); // F12 Konsolda göreceğiz
                kullaniciListesiniEkranaBas(tumKullanicilar);
            } else {
                console.error("🚨 API'den veri alınamadı! Hata Kodu:", response.status);
            }
        } catch (error) {
            console.error("🚨 İstek atılırken bağlantı hatası oluştu:", error);
        }
    }

    // 2. Listeyi Ekrana Basan Fonksiyon (Büyük/Küçük harf duyarlılığı giderildi)
    function kullaniciListesiniEkranaBas(liste) {
        listContainer.innerHTML = "";
        if(liste.length === 0) {
            listContainer.innerHTML = "<span style='padding:10px; color:#666;'>Kullanıcı bulunamadı.</span>";
            return;
        }

        liste.forEach(k => {
            // C#'tan AdSoyad (büyük) veya adsoyad (küçük) gelebilir, ikisini de yakalıyoruz
            const isim = k.adsoyad || k.AdSoyad || "İsimsiz";
            const email = k.eposta || k.Eposta || "E-posta yok";
            const id = k.id || k.Id;

            const div = document.createElement("div");
            div.className = "kullanici-item";
            div.innerHTML = `
                <input type="checkbox" value="${id}" id="user-${id}" class="kullanici-checkbox">
                <label for="user-${id}">${isim} <i>(${email})</i></label>
            `;
            listContainer.appendChild(div);
        });
    }

    // 3. Arama Çubuğu (Büyük/Küçük harf duyarlılığı giderildi)
    if (aramaInput) {
        aramaInput.addEventListener("input", (e) => {
            const arananKelime = e.target.value.toLowerCase().trim();
            const filtrelenmis = tumKullanicilar.filter(k => {
                const isim = (k.adsoyad || k.AdSoyad || "").toLowerCase();
                const email = (k.eposta || k.Eposta || "").toLowerCase();
                
                return isim.includes(arananKelime) || email.includes(arananKelime);
            });
            kullaniciListesiniEkranaBas(filtrelenmis);
        });
    }

    if (btnGrubuKaydet) {
        btnGrubuKaydet.addEventListener("click", async () => {
            const grupAdi = document.getElementById("yeni-grup-adi").value.trim();
            if (!grupAdi) {
                alert("Lütfen bir grup adı girin!");
                return;
            }

            const seciliIdler = Array.from(document.querySelectorAll(".kullanici-checkbox:checked"))
                                     .map(cb => parseInt(cb.value));

            try {
                const response = await fetch("/api/sohbetler/grup-olustur", {
                    method: "POST",
                    headers: { 
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        GrupAdi: grupAdi,
                        KatilimciIdleri: seciliIdler
                    })
                });

                if (response.ok) {
                    alert("Grup başarıyla oluşturuldu!");
                    grupModal.classList.replace("modal-acik", "modal-gizli");
                    window.location.reload(); // Yeni grubu görmek için sayfayı yenile
                } else {
                    const hataMsj = await response.text();
                    alert("Grup oluşturulamadı: " + hataMsj);
                }
            } catch (error) {
                alert("Bağlantı hatası!");
            }
        });
    }
    


    // --- GERÇEK MESAJLAŞMA SİSTEMİ ---
    const sendBtn = document.getElementById("send-btn");
    const messageInput = document.getElementById("message-input");
    const messagesContainer = document.getElementById("messages-container");
    let aktifSohbetId = null; 
    let benimKullaniciIdm = null; 

    // 1. Kendi ID'mizi Token'dan alalım (Kim giden, kim gelen mesaj bilelim)
    function kendiIdmiAl() {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const tokenData = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        return parseInt(tokenData.sub || tokenData.nameid || tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
    }
    benimKullaniciIdm = kendiIdmiAl();

    // 2. Sol Menüden Bir Sohbete Tıklanmasını Dinle
    chatList.addEventListener("click", async (e) => {
        const chatItem = e.target.closest(".chat-item");
        if (!chatItem) return; // Tıklanan yer sohbet kutusu değilse boşver

        // Görsel olarak seçili yap
        document.querySelectorAll(".chat-item").forEach(c => c.classList.remove("active"));
        chatItem.classList.add("active");

        // Tıklanan sohbetin ID'sini ve Adını al
        aktifSohbetId = chatItem.dataset.id;
        const sohbetAdi = chatItem.querySelector("h4").textContent;

        // Sağ üst köşedeki başlığı ve alt metni (Kişiler) güncelle
        const titleEl = document.getElementById("chat-header-title");
        const membersEl = document.getElementById("chat-header-members");
        
        if (titleEl) titleEl.textContent = sohbetAdi;
        if (membersEl) {
            membersEl.textContent = "Kişiler yükleniyor...";
            gruptakiKisileriGetir(aktifSohbetId); // Yeni metodumuzu burada çağırıyoruz
        }

        // 3. API'den Bu Sohbetin Mesajlarını Çek
        await mesajlariGetir(aktifSohbetId);
    });

    // YENİ EKLENEN METOT: Gruba Ait Kişileri Getirme Fonksiyonu
    async function gruptakiKisileriGetir(sohbetId) {
        try {
            const response = await fetch(`/api/sohbetler/${sohbetId}/katilimcilar`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const kisiler = await response.json();
                // Gelen isimleri virgülle yan yana yazdır
                const isimListesi = kisiler.map(k => k.adsoyad || k.AdSoyad).join(", ");
                document.getElementById("chat-header-members").textContent = isimListesi;
            } else {
                document.getElementById("chat-header-members").textContent = "";
            }
        } catch (error) {
            document.getElementById("chat-header-members").textContent = "";
        }
    }

    // 4. Mesajları Veritabanından Getiren Fonksiyon (Hizalama ve Tarih Güncellendi)
    async function mesajlariGetir(sohbetId) {
        messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>Mesajlar yükleniyor...</p>";
        
        try {
            const response = await fetch(`/api/mesajlar/sohbet/${sohbetId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const mesajlar = await response.json();
                messagesContainer.innerHTML = ""; 

                if (mesajlar.length === 0) {
                    messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>Burada henüz hiç mesaj yok. İlk mesajı sen gönder!</p>";
                    return;
                }

                mesajlar.forEach(m => {
                    // Tip dönüşümü ile güvenlik sağladık (Kendi mesajımız mı diye bakıyoruz)
                    const gonderenId = m.gonderenid || m.Gonderenid || m.kullaniciid;
                    const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));
                    
                    const metin = m.icerik || m.Icerik || m.mesaj || m.MesajMetni;
                    
                    // Invalid Date çözümü için doğru C# model özelliğini ekledik
                    const hamTarih = m.gondermeTarihi || m.GondermeTarihi || m.gonderilmetarihi;
                    let saatString = "";
                    if (hamTarih) {
                        const tarihObje = new Date(hamTarih);
                        saatString = tarihObje.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }

                    // Gönderen kişinin adını varsa alıyoruz
                    const gonderenKisiAdi = m.gonderenAd || m.GonderenAd || m.KullaniciAdi || "";

                    ekranaMesajEkle(metin, benMiyim, saatString, gonderenKisiAdi);
                });
            } else {
                messagesContainer.innerHTML = "<p style='text-align:center; color:red; margin-top:20px;'>Mesajlar alınamadı.</p>";
            }
        } catch (error) {
            messagesContainer.innerHTML = "<p style='text-align:center; color:red; margin-top:20px;'>Bağlantı hatası.</p>";
        }
    }

    // 5. Mesajları HTML Olarak Çizen Fonksiyon (Renk, İsim ve Hizalama Güncellendi)
    function ekranaMesajEkle(text, isSent, timeString, gonderenKisi = "") {
        if (!text || text.trim() === "") return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.classList.add(isSent ? "sent" : "received");

        // Sadece karşıdan gelen mesajlarda ve isim bilgisi varsa ismi ufakça yaz
        let isimHtml = (!isSent && gonderenKisi) ? `<span style="font-size:11px; font-weight:bold; color:#008069; display:block; margin-bottom:3px;">${gonderenKisi}</span>` : "";

        messageDiv.innerHTML = `
            ${isimHtml}
            <p style="margin: 0;">${text}</p>
            <span class="msg-time">${timeString}</span>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // En alta kaydır
    }

 
    async function mesajGonder() {
        const metin = messageInput.value.trim();
        
        console.log("📝 Gönderim tetiklendi! Yazılan Mesaj:", metin, "| Aktif Sohbet ID:", aktifSohbetId);

        if (!metin) {
            console.warn("⚠️ Mesaj kutusu boş, gönderim iptal edildi.");
            return;
        }
        
        if (!aktifSohbetId) {
            alert("Lütfen mesaj göndermeden önce sol taraftan bir sohbete tıklayın!");
            return;
        }

        messageInput.value = ""; // Kutuyu temizle

        try {
            // DİKKAT 1: Eğer C# tarafında MesajController kullanıyorsan adres /api/mesaj/gonder olmalıdır.
            const apiAdresi = "/api/mesajlar"; 
            console.log("📡 API'ye İstek Atılıyor... Hedef:", apiAdresi);

           const response = await fetch(apiAdresi, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sohbetid: parseInt(aktifSohbetId),
                    icerik: metin,
                    // EKSİK OLAN 2 VERİYİ EKLİYORUZ:
                    gonderenid: benimKullaniciIdm, 
                    gondermeTarihi: new Date().toISOString() 
                })
            });

            console.log("🚥 API Yanıt Kodu:", response.status);

            if (response.ok) {
                // Başarıyla gittiyse kendi ekranıma da ekle
                const suAn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                ekranaMesajEkle(metin, true, suAn);
            } else {
                const hataMesaji = await response.text();
                console.error("🚨 API Hatası:", hataMesaji);
                alert("Mesaj gönderilemedi (Detay F12 Konsolunda): " + response.status);
            }
        } catch (error) {
            console.error("🚨 Sunucuya ulaşılamadı:", error);
        }
    }

    // Buton veya Enter ile Göndermeyi Tetikle
    if (sendBtn) {
        sendBtn.addEventListener("click", mesajGonder);
    }

    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") mesajGonder();
        });
    }
    // ... YUKARIDAKİ KODLARIN AYNEN DURUYOR ...

    // Buton veya Enter ile Göndermeyi Tetikle
    if (sendBtn) {
        sendBtn.addEventListener("click", mesajGonder);
    }

    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") mesajGonder();
        });
    }

    // =========================================================
    // --- YENİ EKLENEN: SIGNALR GERÇEK ZAMANLI BAĞLANTI ---
    // =========================================================
    
    // 1. Hub Bağlantısını Kur
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chathub", { // C# tarafındaki hub rotan neyse buraya o yazılmalı
            accessTokenFactory: () => token 
        })
        .withAutomaticReconnect()
        .build();

    // 2. Sunucudan Gelen "YeniMesajGeldi" Sinyalini Dinle
    connection.on("YeniMesajGeldi", (mesaj) => {
        // Gelen mesajı atan kişi ben miyim kontrol et
        const gonderenId = mesaj.gonderenid || mesaj.Gonderenid || mesaj.kullaniciid;
        const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));

        // Mesaj, şu an ekranda açık olan sohbete aitse VE atan kişi ben DEĞİLSEM ekrana bas
        // (Çünkü kendi mesajımı 'mesajGonder' içinde zaten ekrana basıyorum)
        if (mesaj.sohbetid == aktifSohbetId && !benMiyim) {
            
            const metin = mesaj.icerik || mesaj.Icerik || mesaj.mesaj;
            const hamTarih = mesaj.gondermeTarihi || mesaj.GondermeTarihi;
            
            let saatString = "";
            if (hamTarih) {
                const tarihObje = new Date(hamTarih);
                saatString = tarihObje.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                saatString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            const gonderenKisiAdi = mesaj.gonderenAd || mesaj.GonderenAd || "Bilinmeyen";
            
            ekranaMesajEkle(metin, false, saatString, gonderenKisiAdi);
        }
    });

    // 3. Bağlantıyı Başlat
    connection.start()
        .then(() => console.log("✅ SignalR Başarıyla Bağlandı!"))
        .catch(err => console.error("🚨 SignalR Bağlantı Hatası: ", err));

}); 
