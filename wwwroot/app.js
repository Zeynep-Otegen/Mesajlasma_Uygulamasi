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

    // Kim giden, kim gelen mesajlarını ayırt edebilmek için kendi kullanıcı ID'mizi alıyoruz
    function kendiIdmiAl() {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const tokenData = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        return parseInt(tokenData.sub || tokenData.nameid || tokenData["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
    }
    benimKullaniciIdm = kendiIdmiAl();

    //Sol Menüden Bir Sohbete Tıklanması Dinleme
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

        // Sohbet mesajlarını getirme ve ekrana yansıtma
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

    //Mesajları getirme ve yansıtma
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

                    const dosyaLink = m.dosyaYolu || m.DosyaYolu || null;
                    ekranaMesajEkle(metin, benMiyim, saatString, gonderenKisiAdi, dosyaLink);
                });
            } else {
                messagesContainer.innerHTML = "<p style='text-align:center; color:red; margin-top:20px;'>Mesajlar alınamadı.</p>";
            }
        } catch (error) {
            messagesContainer.innerHTML = "<p style='text-align:center; color:red; margin-top:20px;'>Bağlantı hatası.</p>";
        }
    }

    
    function ekranaMesajEkle(text, isSent, timeString, gonderenKisi = "", dosyaYolu = null) {
        if (!text || text.trim() === "") return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.classList.add(isSent ? "sent" : "received");

        let isimHtml = (!isSent && gonderenKisi) ? `<span style="font-size:11px; font-weight:bold; color:#008069; display:block; margin-bottom:3px;">${gonderenKisi}</span>` : "";

        // FontAwesome hoparlör ikonu
        let sesIkonu = `<i class="fas fa-volume-up btn-seslendir" style="cursor:pointer; color:#888; font-size:13px; margin-left:10px;" title="Bu mesajı seslendir"></i>`;

        // YENİ EKLENEN: EĞER DOSYA VARSA ŞIK BİR İNDİRME KUTUSU OLUŞTUR
        let dosyaHtml = "";
        if (dosyaYolu) {
            // Linkteki guid'li uzun isimden sadece dosya uzantısını veya adını çıkarmak için ufak bir ayar
            const dosyaAdi = dosyaYolu.split('/').pop() || "Ekli Dosya";
            
            dosyaHtml = `
                <div style="margin-top: 8px; padding: 8px; background-color: rgba(0,0,0,0.05); border-radius: 6px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-file-download" style="color: #008069; font-size: 20px;"></i>
                    <a href="${dosyaYolu}" target="_blank" style="text-decoration: none; color: #111b21; font-weight: 500; font-size: 13px; word-break: break-all;">
                        ${dosyaAdi}
                    </a>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            ${isimHtml}
            <div style="display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <p style="margin: 0; flex: 1;">${text}</p>
                    ${sesIkonu}
                </div>
                ${dosyaHtml} <!-- DOSYA KUTUSUNU BURAYA BASTIK -->
            </div>
            <span class="msg-time">${timeString}</span>
        `;

        // Tıklama Olayı: Kullanıcı hoparlöre basarsa metni seslendir
        const btnSes = messageDiv.querySelector('.btn-seslendir');
        btnSes.addEventListener('click', () => {
            metniSeslendir(text); 
        });

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // En alta kaydır
    }

 
   
    async function mesajGonder(zorlaOku = false) { 
        const metin = messageInput.value.trim();
        
        console.log("📝 Gönderim tetiklendi! Yazılan Mesaj:", metin, "| Aktif Sohbet ID:", aktifSohbetId);

        // Eğer ne metin yazılmış ne de dosya seçilmişse işlemi durdur
        if (!metin && !seciliDosya) return;
        
        if (!aktifSohbetId) {
            alert("Lütfen mesaj göndermeden önce sol taraftan bir sohbete tıklayın!");
            return;
        }

        messageInput.value = ""; // Kutuyu temizle
        let yuklenenDosyaYolu = null;

        // ==========================================
        // 1. ADIM: EĞER DOSYA SEÇİLMİŞSE ÖNCE ONU YÜKLE
        // ==========================================
        if (seciliDosya) {
            const formData = new FormData();
            formData.append("file", seciliDosya);
            formData.append("sohbetId", aktifSohbetId);
            formData.append("gonderenId", benimKullaniciIdm);

            try {
                // DosyalarController'a dosyayı fırlatıyoruz
                const uploadRes = await fetch("/api/dosyalar/yukle", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData // DİKKAT: JSON değil FormData gönderiyoruz
                });
                
                if (uploadRes.ok) {
                    const sonuc = await uploadRes.json();
                    yuklenenDosyaYolu = sonuc.dosyaYolu; // Sunucudan gelen "/uploads/xyz.jpg" linkini aldık!
                    
                    // Yükleme bitince önizleme kutusunu temizleyip kapatıyoruz
                    seciliDosya = null;
                    const dosyaOnizlemeKutusu = document.getElementById("dosya-onizleme-kutusu");
                    if (dosyaOnizlemeKutusu) dosyaOnizlemeKutusu.style.display = "none";
                } else {
                    alert("Dosya sunucuya yüklenirken bir hata oluştu.");
                    return; // Dosya yüklenemezse mesajı da yollama, işlemi durdur
                }
            } catch (error) {
                console.error("Dosya yükleme hatası:", error);
                return;
            }
        }

        // ==========================================
        // 2. ADIM: METNİ VE DOSYA YOLUNU VERİTABANINA KAYDET
        // ==========================================
        try {
            const apiAdresi = "/api/mesajlar"; 
            const response = await fetch(apiAdresi, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sohbetid: parseInt(aktifSohbetId),
                    icerik: metin || "📁 Dosya gönderildi", // Metin boşsa ekranda bu yazsın
                    gonderenid: benimKullaniciIdm, 
                    gondermeTarihi: new Date().toISOString(),
                    dosyaYolu: yuklenenDosyaYolu // Az önce aldığımız dosya linkini C#'a iletiyoruz
                })
            });

            if (response.ok) {
                const suAn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                
                // 4. parametre boş isim (""), 5. parametre dosya yoludur
ekranaMesajEkle(metin || "📁 Dosya gönderildi", true, suAn, "", yuklenenDosyaYolu);

                // YENİ: Kendi gönderdiğimiz mesajı okuma senaryosu
                const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
                if (zorlaOku || (ayarlar && ayarlar.otomatikOku === true)) {
                    metniSeslendir(metin || "Dosya gönderildi");
                }
            } else {
                console.error("🚨 API Hatası:", await response.text());
                alert("Mesaj gönderilemedi: " + response.status);
            }
        } catch (error) {
            console.error("🚨 Sunucuya ulaşılamadı:", error);
        }
    }


    // =========================================================
    // --- SIGNALR GERÇEK ZAMANLI BAĞLANTI ---
    // =========================================================
    
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chathub", { 
            accessTokenFactory: () => token 
        })
        .withAutomaticReconnect()
        .build();

    connection.on("YeniMesajGeldi", (mesaj) => {
        const gonderenId = mesaj.gonderenid || mesaj.Gonderenid || mesaj.kullaniciid;
        const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));

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
            
            const dosyaLink = mesaj.dosyaYolu || mesaj.DosyaYolu || null;
ekranaMesajEkle(metin, false, saatString, gonderenKisiAdi, dosyaLink);
            
            // YENİ: Karşıdan mesaj gelince Otomatik Oku açıksa seslendir
            const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
            if (ayarlar && ayarlar.otomatikOku === true) {
                metniSeslendir(metin);
            }
        }
    });

    connection.start()
        .then(() => console.log("✅ SignalR Başarıyla Bağlandı!"))
        .catch(err => console.error("🚨 SignalR Bağlantı Hatası: ", err));


    // =========================================================
    // --- TTS AYARLARI VE LOCALSTORAGE YÖNETİMİ ---
    // =========================================================

    const btnAyarlar = document.getElementById("btn-ayarlar");
    const ayarlarModal = document.getElementById("ayarlar-modal");
    const ayarlarKapat = document.getElementById("ayarlar-modal-kapat");
    const btnAyarlariKaydet = document.getElementById("btn-ayarlari-kaydet");

    const ttsDil = document.getElementById("tts-dil");
    const ttsSes = document.getElementById("tts-ses");
    const ttsHiz = document.getElementById("tts-hiz");
    const hizGosterge = document.getElementById("hiz-gosterge");
    const ttsOtomatik = document.getElementById("tts-otomatik");

    function ayarlariYukle() {
        const kayitliAyarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
        if (kayitliAyarlar) {
            ttsDil.value = kayitliAyarlar.dil || "tr-TR";
            ttsSes.value = kayitliAyarlar.ses || "tr-TR-Standard-A";
            ttsHiz.value = kayitliAyarlar.hiz || "1.0";
            hizGosterge.textContent = kayitliAyarlar.hiz || "1.0";
            ttsOtomatik.checked = kayitliAyarlar.otomatikOku || false;
        }
    }
    ayarlariYukle(); 

    if (ttsHiz) {
        ttsHiz.addEventListener("input", (e) => {
            hizGosterge.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }

    if (btnAyarlar) {
        btnAyarlar.addEventListener("click", () => {
            ayarlarModal.classList.replace("modal-gizli", "modal-acik");
        });
    }
    if (ayarlarKapat) {
        ayarlarKapat.addEventListener("click", () => {
            ayarlarModal.classList.replace("modal-acik", "modal-gizli");
        });
    }

    if (btnAyarlariKaydet) {
        btnAyarlariKaydet.addEventListener("click", () => {
            const yeniAyarlar = {
                dil: ttsDil.value,
                ses: ttsSes.value,
                hiz: parseFloat(ttsHiz.value).toFixed(1),
                otomatikOku: ttsOtomatik.checked
            };
            localStorage.setItem("ttsAyarlari", JSON.stringify(yeniAyarlar));
            alert("Ayarlar başarıyla kaydedildi!");
            ayarlarModal.classList.replace("modal-acik", "modal-gizli");
        });
    }

    // =========================================================
    // --- GOOGLE CLOUD TTS & MESAJ KUYRUĞU (QUEUE) SİSTEMİ ---
    // =========================================================

    const mesajKuyrugu = []; 
    let sesOynatiliyor = false;

    function metniSeslendir(metin) {
        mesajKuyrugu.push(metin); 
        kuyruguIsle(); 
    }

    async function kuyruguIsle() {
        if (sesOynatiliyor || mesajKuyrugu.length === 0) return;

        sesOynatiliyor = true; 
        const metin = mesajKuyrugu.shift(); 

        const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari")) || {
            dil: "tr-TR", 
            ses: "tr-TR-Standard-A", 
            hiz: "1.0"
        };

        try {
            //Güvenli C# sunucuya istek atılır.
            const response = await fetch("/api/tts/seslendir", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`, // JWT Token ekleme
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    text: metin,
                    languageCode: ayarlar.dil,
                    voiceName: ayarlar.ses,
                    speakingRate: parseFloat(ayarlar.hiz)
                })
            });

            if (response.ok) {
                const data = await response.json();
                const audioSrc = "data:audio/mp3;base64," + data.audioContent;
                const sesPlayer = new Audio(audioSrc);
                
                sesPlayer.onended = () => {
                    sesOynatiliyor = false; 
                    kuyruguIsle(); 
                };

                sesPlayer.play();
            } else {
                console.error("C# Sunucu TTS Hatası:", response.status);
                sesOynatiliyor = false; 
                kuyruguIsle(); 
            }
        } catch (error) {
            console.error("Bağlantı hatası:", error);
            sesOynatiliyor = false;
            kuyruguIsle(); 
        }
    }
    // =========================================================
    // --- TUŞ KOMBİNASYONLARI (KULLANICI DENEYİMİ) ---
    // =========================================================

    // Gönder Butonuna Tıklama (Normal Gönderim)
    if (sendBtn) {
        // Eski çakışan kodları silip sadece bunu ekledik
        sendBtn.addEventListener("click", () => mesajGonder(false));
    }

    // Klavye Kombinasyonları
    if (messageInput) {
        messageInput.addEventListener("keydown", (e) => {
            
            // 1. Ctrl + Shift + S (Gönder ve Seslendir)
            if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s")) {
                e.preventDefault(); 
                mesajGonder(true); 
                return; 
            }

            // 2. ENTER TUŞU SENARYOLARI
            if (e.key === "Enter") {
                if (e.shiftKey) {
                    // Shift + Enter: Alt satıra geç (Sadece input alanındayken çalışır)
                    return; 
                } 
                else if (e.ctrlKey) {
                    // Ctrl + Enter: Mesajı Gönder ve ZORLA Seslendir
                    e.preventDefault();
                    mesajGonder(true); 
                } 
                else {
                    // Sadece Enter: Normal Gönder 
                    e.preventDefault();
                    mesajGonder(false);
                }
            }
        });
    }

   // =========================================================
    // --- DOSYA PAYLAŞMA & ÖNİZLEME İŞLEMLERİ ---
    // =========================================================

    const btnAtac = document.getElementById("btn-atac");
    const gizliDosyaSecici = document.getElementById("gizli-dosya-secici");
    const dosyaOnizlemeKutusu = document.getElementById("dosya-onizleme-kutusu");
    const onizlemeDosyaAdi = document.getElementById("onizleme-dosya-adi");
    const btnOnizlemeKapat = document.getElementById("btn-onizleme-kapat");
    
    let seciliDosya = null; 

    if (btnAtac && gizliDosyaSecici) {
        btnAtac.addEventListener("click", () => gizliDosyaSecici.click());

        gizliDosyaSecici.addEventListener("change", (e) => {
            seciliDosya = e.target.files[0];
            if (!seciliDosya) return;

           
            onizlemeDosyaAdi.textContent = seciliDosya.name;
            dosyaOnizlemeKutusu.style.display = "block";
            
            
            gizliDosyaSecici.value = ""; 
        });
    }

    if (btnOnizlemeKapat) {
        btnOnizlemeKapat.addEventListener("click", () => {
            seciliDosya = null; // Hafızadan sil
            dosyaOnizlemeKutusu.style.display = "none"; // Kutuyu kapat
        });
    }
    // =========================================================
    // --- EMOJİ SEÇİCİ İŞLEMLERİ ---
    // =========================================================
    
    const btnEmoji = document.getElementById("btn-emoji");
    const emojiContainer = document.getElementById("emoji-picker-container");
    const picker = document.querySelector("emoji-picker");

    if (btnEmoji && emojiContainer && picker) {
        // paneli aç/kapat
        btnEmoji.addEventListener("click", (e) => {
            e.stopPropagation(); 
            if (emojiContainer.style.display === "none") {
                emojiContainer.style.display = "block";
            } else {
                emojiContainer.style.display = "none";
            }
        });

       
        picker.addEventListener("emoji-click", (e) => {
            const secilenEmoji = e.detail.unicode; 
            messageInput.value += secilenEmoji;    
            messageInput.focus();                 
        });

      
        document.addEventListener("click", (e) => {
            if (emojiContainer.style.display === "block" && !emojiContainer.contains(e.target) && e.target !== btnEmoji) {
                emojiContainer.style.display = "none";
            }
        });
    }
}); 

