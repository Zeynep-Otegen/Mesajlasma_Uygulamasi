document.addEventListener("DOMContentLoaded", () => {

    const kullaniciVerisi = localStorage.getItem("kullanici");
if (!kullaniciVerisi) {
        // Token yoksa demek ki giriş yapmamış, logine geri gönder
        window.location.href = "login.html";
        return;
    }
// XSS Saldırılarını önlemek için HTML karakterlerini zararsız metne çevirir (HTML Encode)
function htmlGuvenliYap(metin) {
    if (!metin) return "";
    const div = document.createElement('div');
    div.textContent = metin; 
    return div.innerHTML;    
}
    // Arayüz Elementleri
    const aktifKullanici = JSON.parse(kullaniciVerisi);
    const currentUserName = document.getElementById("current-user-name");
    const currentUserEmail = document.getElementById("current-user-email");
    const chatList = document.getElementById("chat-list");
    const logoutBtn = document.getElementById("logout-btn");

    // 1. KİMLİK BİLGİLERİNİ GETİR VE YAZDIR
   async function kullaniciBilgileriniGetir() {
    currentUserName.textContent = aktifKullanici.adSoyad || "İsimsiz Kullanıcı";
    currentUserEmail.textContent = aktifKullanici.eposta || "Email bulunamadı";
}

    
    // 2. SOHBETLERİ GETİR
   
    async function sohbetleriGetir() {
    try {
        // ESKİ UZUN TOKEN ÇÖZME İŞLEMLERİNİ TAMAMEN SİLDİK!
        // Artık ID'yi doğrudan temiz objemizden alıyoruz:
        const kullaniciId = aktifKullanici.id;

        if (!kullaniciId) {
            console.error("Kullanıcı ID bulunamadı!");
            return;
        }

        console.log(`📡 Sohbetler API'sine istek atılıyor... Hedef: /api/sohbetler/kullanici/${kullaniciId}`);
        
        const response = await fetch(`/api/sohbetler/kullanici/${kullaniciId}`, {
            method: "GET",
            credentials: "include", // SİHİRLİ KELİME: Gizli Cookie'yi sunucuya otomatik yollar
            headers: {
                "Content-Type": "application/json"
                // "Authorization" satırını tamamen kaldırdık!
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

                const badgeHtml = sohbet.okunmamisMesajSayisi > 0 
                    ? `<div class="unread-badge">${sohbet.okunmamisMesajSayisi}</div>` 
                    : "";

                let onizleme = sohbet.sonMesajIcerik || "Henüz mesaj yok...";

                if (onizleme !== "Henüz mesaj yok...") {
                    const gidenMesajId = sohbet.sonMesajGonderenId || sohbet.SonMesajGonderenId || 0;
                    if (Number(gidenMesajId) === Number(kullaniciId) && Number(gidenMesajId) !== 0) {
                        onizleme = `Siz: ${onizleme}`;
                    } else if (sohbet.grupmu && sohbet.sonMesajGonderenAd) {
                        let kisaAd = sohbet.sonMesajGonderenAd.split(' ')[0];
                        onizleme = `~${kisaAd}: ${onizleme}`;
                    }
                }

                if (onizleme.length > 35) onizleme = onizleme.substring(0, 35) + "...";
                onizleme = htmlGuvenliYap(onizleme);
                    
                chatItem.innerHTML = `
                    <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Grup" class="profile-pic">
                    <div class="chat-details">
                        <div class="chat-title">
                            <h4>${sohbet.grupadi || sohbet.grupAdi || sohbet.GrupAdi || "İsimsiz Sohbet"}</h4>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                <span class="time">-</span>
                                ${badgeHtml}
                            </div>
                        </div>
                        <div class="chat-last-message">
                            <p>${onizleme}</p>
                        </div>
                    </div>
                `;
                chatList.appendChild(chatItem);
            });
        }
        else {
            // YENİ EKLENEN KISIM: Eğer API bizi reddederse sessiz kalmasın!
            console.error("🚨 API Hatası:", response.status);
            if (response.status === 401) {
                alert("Oturumunuzun süresi dolmuş veya Çerez (Cookie) alınamamış. Lütfen tekrar giriş yapın!");
                localStorage.removeItem("kullanici");
                window.location.href = "login.html"; // Logine geri at
            }
        }
    } catch (error) {
        console.error("🚨 Sunucuya bağlanırken hata oluştu:", error);
    }
}

    // Çıkış Yapma
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        // API'ye çerezi silmesini söyle
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
        
        // Frontend'i temizle
        localStorage.removeItem("kullanici");
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

   //Kullanıcıları Getiren Fonksiyon (Güncellendi)
    async function sistemdekiKullanicilariGetir() {
        try {
            console.log("📡 Kullanıcı listesi için API'ye istek atılıyor...");
            
            
            const response = await fetch("/api/kullanicilar/grup-icin-liste", {
                credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
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

   
    function kullaniciListesiniEkranaBas(liste) {
        listContainer.innerHTML = "";
        if(liste.length === 0) {
            listContainer.innerHTML = "<span style='padding:10px; color:#666;'>Kullanıcı bulunamadı.</span>";
            return;
        }

        liste.forEach(k => {
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

    //Büyük/Küçük harf duyarlılığı giderildi
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
                    credentials: "include", 
                    headers: { 
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
    let suAnkiSayfa = 1;               
    let dahaFazlaMesajVarMi = true;    
    let mesajlarYukleniyor = false;    //Arka arkaya iki istek atmayı önler

   function kendiIdmiAl() {
    return parseInt(aktifKullanici.id);
                        }
    benimKullaniciIdm = kendiIdmiAl();
    

    //Sol Menüden Bir Sohbete Tıklanması Dinleme
    
    chatList.addEventListener("click", async (e) => {
        const chatItem = e.target.closest(".chat-item");
        if (!chatItem) return;

        // Görsel olarak seçili yap
        document.querySelectorAll(".chat-item").forEach(c => c.classList.remove("active"));
        chatItem.classList.add("active");

        const id = chatItem.dataset.id;
        const sohbetAdi = chatItem.querySelector("h4").textContent;

        // YENİ YAZISINI TEMİZLE
        const p = chatItem.querySelector(".chat-last-message p");
        if (p && p.innerHTML.includes("Yeni:")) {
            p.innerHTML = p.innerHTML.replace(/<span.*?>Yeni:<\/span>\s*/, "");
        }
        
        const badge = chatItem.querySelector(".unread-badge");
        if (badge) badge.remove();

        await window.sohbetiAc(id, sohbetAdi); 
    });

    //  Sohbet Açma Fonksiyonu
    window.sohbetiAc = async function(id, sohbetAdi = "Sohbet") {
        aktifSohbetId = id;
        
        //Yeni sohbette hafıza sıfırlanır
        suAnkiSayfa = 1;
        dahaFazlaMesajVarMi = true;
        mesajlarYukleniyor = false; 
        
        const titleEl = document.getElementById("chat-header-title");
        const membersEl = document.getElementById("chat-header-members");
        
        if (titleEl) titleEl.textContent = sohbetAdi;
        if (membersEl) {
            membersEl.textContent = "Kişiler yükleniyor...";
            gruptakiKisileriGetir(aktifSohbetId);
        }

        fetch(`/api/sohbetler/${aktifSohbetId}/okundu-isaretle`, {
            method: "POST",
            credentials: "include", 
            headers: { 
                "Content-Type": "application/json" 
            }
        }).catch(err => console.error("Okundu işaretlenirken hata:", err));
        
        // İlk yükleme (yukariKaydirmaMi = false) olarak çağırıyoruz
        await mesajlariGetir(aktifSohbetId, false);
    };

    
    async function gruptakiKisileriGetir(sohbetId) {
        try {
            const response = await fetch(`/api/sohbetler/${sohbetId}/katilimcilar`, {
                credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
            });

            if (response.ok) {
                const kisiler = await response.json();
                
                
                const isimListesi = kisiler.map(k => {
                    const kisiId = k.id || k.Id;
                   
                    if (Number(kisiId) === Number(benimKullaniciIdm)) {
                        return "Siz";
                    }
                    return k.adsoyad || k.AdSoyad;
                }).join(", ");
                
                document.getElementById("chat-header-members").textContent = isimListesi;
            } else {
                document.getElementById("chat-header-members").textContent = "";
            }
        } catch (error) {
            document.getElementById("chat-header-members").textContent = "";
        }
    }

    async function mesajlariGetir(sohbetId, yukariKaydirmaMi = false) {
        // Eğer zaten yükleniyorsa veya geçmiş bittiyse işlemi durdur
        if (yukariKaydirmaMi && (mesajlarYukleniyor || !dahaFazlaMesajVarMi)) return;

            mesajlarYukleniyor = true;

        if (!yukariKaydirmaMi) {
            // Sohbete sol menüden ilk defa tıklandıysa sayfayı sıfırla
            messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'><i class='fas fa-spinner fa-spin'></i> Yükleniyor...</p>";
            suAnkiSayfa = 1;
            dahaFazlaMesajVarMi = true;
        } else {
            // Kullanıcı yukarı kaydırdıysa (geçmişi istiyorsa) geçici bir 'Yükleniyor' yazısı koy
            const loader = document.createElement("div");
            loader.id = "eski-mesaj-loader";
            loader.innerHTML = "<p style='text-align:center; color:#888; font-size:12px; margin:5px;'>Eski mesajlar yükleniyor...</p>";
            messagesContainer.prepend(loader);
        }
        
        try {
            const limit = 20; // Her seferinde 20 mesaj çekeceğiz
            console.log(`🔄 [SAYFALAMA] Sohbet ID: ${sohbetId} | İstek Atılan Sayfa: ${suAnkiSayfa} | Beklenen Mesaj: ${limit}`);
            const response = await fetch(`/api/mesajlar/sohbet/${sohbetId}?sayfa=${suAnkiSayfa}&limit=${limit}`, {
                credentials: "include", 
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
            const mesajlar = await response.json();
            console.log(`✅ [BAŞARILI] Veritabanından ${mesajlar.length} adet mesaj çekildi. (Sayfa: ${suAnkiSayfa})`);
            
            if (!yukariKaydirmaMi) {
                messagesContainer.innerHTML = ""; 
            } else {
                document.getElementById("eski-mesaj-loader")?.remove();
            }

            if (mesajlar.length === 0 && !yukariKaydirmaMi) {
                messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>Burada henüz hiç mesaj yok. İlk mesajı sen gönder!</p>";
                mesajlarYukleniyor = false;
                return;
            }

            // 1. DÜZELTME: Eski koddaki "Sohbetin Başı" HTML oluşturma kısmını buradan SİLDİK! 
            // Sadece geçmişin bittiğini değişkene söylüyoruz.
            if (mesajlar.length < limit) {
                dahaFazlaMesajVarMi = false;
            }

            const eskiScrollYuksekligi = messagesContainer.scrollHeight;

            if (yukariKaydirmaMi) {
                mesajlar.reverse();
            }

            mesajlar.forEach(m => {
                const gonderenId = m.gonderenid || m.Gonderenid || m.kullaniciid;
                const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));
                const metin = m.icerik || m.Icerik || m.mesaj || m.MesajMetni;
                
                const hamTarih = m.gondermeTarihi || m.GondermeTarihi || m.gonderilmetarihi;
                let saatString = "";
                if (hamTarih) {
                    const tarihObje = new Date(hamTarih);
                    saatString = tarihObje.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                }
                
                const gonderenKisiAdi = m.gonderenAd || m.GonderenAd || m.KullaniciAdi || "";
                const dosyaLink = m.dosyaYolu || m.DosyaYolu || null;
                
                ekranaMesajEkle(metin, benMiyim, saatString, gonderenKisiAdi, dosyaLink, m.id || m.Id, yukariKaydirmaMi);
            });

            // =========================================================
            // 2. DÜZELTME (SİHİRLİ KISIM): Yazıyı DÖNGÜDEN SONRA koyuyoruz!
            // =========================================================
            if (!dahaFazlaMesajVarMi && !document.getElementById("sohbet-basi-etiketi")) {
                const sohbetBasi = document.createElement("p");
                sohbetBasi.id = "sohbet-basi-etiketi"; // Çift eklemeyi önlemek için ID verdik
                sohbetBasi.style = "text-align:center; color:#ccc; font-size:11px; margin: 15px 0;";
                sohbetBasi.textContent = "--- Sohbetin Başı ---";
                
                // Bütün eski mesajlar eklendikten sonra en üste koyduğu için kesinlikle TEPEYE oturacak!
                messagesContainer.prepend(sohbetBasi); 
            }

            // Scroll Bar Ayarlaması
            if (yukariKaydirmaMi) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight - eskiScrollYuksekligi;
            } else {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            suAnkiSayfa++; 
        }
        } catch (error) {
            console.error("Mesajlar çekilirken hata:", error);
        }
        mesajlarYukleniyor = false; // Kilidi aç
    }

    // 2. KAYDIRMA (SCROLL) OLAYINI DİNLEYEN TETİKLEYİCİ (YENİ)
    messagesContainer.addEventListener("scroll", () => {
        // Eğer kullanıcı mesajlarda en yukarı (0 noktasına) ulaştıysa geçmiş mesajları yükle
        if (messagesContainer.scrollTop === 0 && dahaFazlaMesajVarMi && !mesajlarYukleniyor && aktifSohbetId) {
            mesajlariGetir(aktifSohbetId, true); 
        }
    });

    
    function ekranaMesajEkle(text, isSent, timeString, gonderenKisi = "", dosyaYolu = null, mesajId = null, usteEkle = false) {
        if (!text || text.trim() === "") return;
        const guvenliMetin = htmlGuvenliYap(text);

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.classList.add(isSent ? "sent" : "received");
        if(mesajId) messageDiv.dataset.mesajid = mesajId; // Arama kısmı için ID'yi de gömüyoruz

        let isimHtml = (!isSent && gonderenKisi) ? `<span style="font-size:11px; font-weight:bold; color:#008069; display:block; margin-bottom:3px;">${gonderenKisi}</span>` : "";
        let sesIkonu = `<i class="fas fa-volume-up btn-seslendir" style="cursor:pointer; color:#888; font-size:13px; margin-left:10px;" title="Bu mesajı seslendir"></i>`;
        
        let dosyaHtml = "";
        if (dosyaYolu) {
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
                    <p style="margin: 0; flex: 1;">${guvenliMetin}</p>
                    ${sesIkonu}
                </div>
                ${dosyaHtml}
            </div>
            <span class="msg-time">${timeString}</span>
        `;

        const btnSes = messageDiv.querySelector('.btn-seslendir');
        btnSes.addEventListener('click', () => { metniSeslendir(text); });

        // SİHİR BURADA: Uste mi (eski mesaj), Alta mı (yeni mesaj) eklenmeli?
        if (usteEkle) {
            messagesContainer.prepend(messageDiv);
        } else {
            messagesContainer.appendChild(messageDiv);
        }

        // Sadece normal (ilk) yüklemelerde ve canlı mesaj geldiğinde en alta kaydırır
        if (!usteEkle) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
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
                    credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
},
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
                credentials: "include", 
                    headers: { 
                        "Content-Type": "application/json" 
                            },
                body: JSON.stringify({
                    sohbetid: parseInt(aktifSohbetId),
                    icerik: metin || "📁 Dosya gönderildi", // Metin boşsa ekranda bu yazsın
                    gonderenid: benimKullaniciIdm, 
                    gondermeTarihi: new Date().toISOString(),
                    dosyaYolu: yuklenenDosyaYolu // Alınan dosya linkini veritabaanına kaydetme
                })
            });

            if (response.ok) {
                const suAn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                
                
                ekranaMesajEkle(metin || "📁 Dosya gönderildi", true, suAn, "", yuklenenDosyaYolu);

const solSohbetKutusu = document.querySelector(`.chat-item[data-id='${aktifSohbetId}']`);
if (solSohbetKutusu) {
    const sonMesajP = solSohbetKutusu.querySelector(".chat-last-message p");
    if (sonMesajP) {
        sonMesajP.innerHTML = `Siz: ${htmlGuvenliYap(metin) || "📁 Dosya"}`;
    }
    // Sohbeti listesinin en üstüne al
    const chatListContainer = document.getElementById("chat-list");
    if (chatListContainer) chatListContainer.prepend(solSohbetKutusu);
}

                //Kendi gönderdiğimiz mesajı okuma senaryosu
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
    .withUrl("/chathub") 
    .withAutomaticReconnect()
    .build();
        

    connection.on("YeniMesajGeldi", (mesaj) => {
    const gonderenId = mesaj.gonderenid || mesaj.Gonderenid || mesaj.kullaniciid;
    const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));

    const metin = mesaj.icerik || mesaj.Icerik || mesaj.mesaj;
    const guvenliMetin = htmlGuvenliYap(metin);
    // DİREKT TARİHİ ALIYORUZ
    const hamTarih = mesaj.gondermeTarihi || mesaj.GondermeTarihi;
    let saatString = "";

    if (hamTarih) {
        const tarihObje = new Date(hamTarih);
        saatString = tarihObje.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
        saatString = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
        
    const gonderenKisiAdi = mesaj.gonderenAd || mesaj.GonderenAd || "Bilinmeyen";
    const dosyaLink = mesaj.dosyaYolu || mesaj.DosyaYolu || null;

    if (mesaj.sohbetid == aktifSohbetId && !benMiyim) {
        //KULLANICI ŞU AN MESAJIN GELDİĞİ SOHBETİN İÇİNDE
        ekranaMesajEkle(metin, false, saatString, gonderenKisiAdi, dosyaLink);
        
        // Mesajı anında gördüğü için arka planda saati hemen güncelleyelim ki rozet oluşmasın
        fetch(`/api/sohbetler/${aktifSohbetId}/okundu-isaretle`, {
            method: "POST",
            credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
        }).catch(err => console.error(err));

        // Sesli okuma açıksa oku
        const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
        if (ayarlar && ayarlar.otomatikOku === true) {
            metniSeslendir(metin);
        }

        // ===================================
        // SOL MENÜYÜ GÜNCELLE VE ÜSTE TAŞI
        // ===================================
        const solSohbetKutusu = document.querySelector(`.chat-item[data-id='${mesaj.sohbetid}']`);
        if (solSohbetKutusu) {
            const sonMesajP = solSohbetKutusu.querySelector(".chat-last-message p");
            if (sonMesajP) {
                let kisaAd = gonderenKisiAdi.split(' ')[0];
                sonMesajP.innerHTML = `<span style="color:var(--brand); font-weight:600;">~${kisaAd}:</span> ${guvenliMetin || "📁 Dosya"}`;
            }
            
            const chatListContainer = document.getElementById("chat-list");
            if (chatListContainer) {
                chatListContainer.prepend(solSohbetKutusu);
            }
        }
        // =========================================================
    } 
    else if (!benMiyim) {
        //KULLANICI BAŞKA BİR SOHBETTE VEYA BEKLEMEDE (DİNAMİK ROZET)
        const solSohbetKutusu = document.querySelector(`.chat-item[data-id='${mesaj.sohbetid}']`);
        
        if (solSohbetKutusu) {
            const sonMesajP = solSohbetKutusu.querySelector(".chat-last-message p");
            if (sonMesajP) {
                //Gönderen kişinin sadece ilk ismini al
                let kisaAd = gonderenKisiAdi.split(' ')[0];
                
                // F5'teki görünümün aynısını dinamik olarak basıyoruz. 
                // Okunmamış olduğunu vurgulamak için markanın rengini ve kalın fontu koruduk.
                sonMesajP.innerHTML = `<span style="color:var(--brand); font-weight:600;">~${kisaAd}:</span> ${guvenliMetin || "📁 Dosya"}`;
            }

            // Rozet kontrolü ve sayım artırma
            let rozet = solSohbetKutusu.querySelector(".unread-badge");
            if (rozet) {
                let mevcutSayi = parseInt(rozet.textContent) || 0;
                rozet.textContent = mevcutSayi + 1;
            } else {
                const titleDiv = solSohbetKutusu.querySelector(".chat-title > div");
                if (titleDiv) {
                    titleDiv.innerHTML += `<div class="unread-badge">1</div>`;
                }
            }

            const chatListContainer = document.getElementById("chat-list");
            if (chatListContainer) {
                chatListContainer.prepend(solSohbetKutusu);
            }
        }
    }
});
connection.on("KullaniciDurumDegisti", (kullaniciId, isOnline) => {
        
        const kisiIndex = aktifKisilerVerisi.findIndex(k => k.id === kullaniciId || k.Id === kullaniciId);
        if (kisiIndex !== -1) {
            aktifKisilerVerisi[kisiIndex].cevrimiciMi = isOnline;
            
            
            if (kisilerModal.classList.contains("modal-acik")) {
                kisileriEkranaCiz(aktifKisilerVerisi);
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
                credentials: "include", 
                headers: { 
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
    // =========================================================
    // --- KİŞİLER LİSTESİ VE ÇEVRİMİÇİ DURUMU ---
    // =========================================================
    
    const btnKisilerListele = document.getElementById("btn-kisiler-listele");
    const kisilerModal = document.getElementById("kisiler-modal");
    const kisilerModalKapat = document.getElementById("kisiler-modal-kapat");
    const kisilerListesiContainer = document.getElementById("kisiler-listesi-container");
    const kisilerAraInput = document.getElementById("kisiler-ara-input");
    
    let aktifKisilerVerisi = []; 

    if (btnKisilerListele) {
        btnKisilerListele.addEventListener("click", async () => {
            kisilerModal.style.display = "block"; // Modalı aç
            kisilerListesiContainer.innerHTML = "<p style='text-align:center;'>Kişiler yükleniyor...</p>";

            try {
                
                const response = await fetch("/api/kullanicilar", { 
                    credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
                });

                if (response.ok) {
                    aktifKisilerVerisi = await response.json();
                    kisileriEkranaCiz(aktifKisilerVerisi);
                } else {
                    kisilerListesiContainer.innerHTML = "<p style='color:red;'>Kişiler alınamadı.</p>";
                }
            } catch (error) {
                kisilerListesiContainer.innerHTML = "<p style='color:red;'>Bağlantı hatası.</p>";
            }
        });
    }

    if (kisilerModalKapat) {
        kisilerModalKapat.addEventListener("click", () => {
            kisilerModal.style.display = "none";
            if(kisilerAraInput) kisilerAraInput.value = "";
        });
    }

    if (kisilerAraInput) {
        kisilerAraInput.addEventListener("input", (e) => {
            const aranan = e.target.value.toLowerCase().trim();
            const filtrelenmis = aktifKisilerVerisi.filter(k => 
                (k.adSoyad || k.AdSoyad || "").toLowerCase().includes(aranan)
            );
            kisileriEkranaCiz(filtrelenmis);
        });
    }

    function kisileriEkranaCiz(kisilerArray) {
        kisilerListesiContainer.innerHTML = "";
        if (kisilerArray.length === 0) {
            kisilerListesiContainer.innerHTML = "<p style='text-align:center; color:#888;'>Kişi bulunamadı.</p>";
            return;
        }

        kisilerArray.forEach(k => {
            const isim = k.adSoyad || k.AdSoyad || k.adsoyad || "İsimsiz";
            const isOnline = k.cevrimiciMi || k.CevrimiciMi || false; 
            
            const durumRengi = isOnline ? "#25D366" : "#8696a0"; // WhatsApp Yeşili veya Gri
            const durumYazisi = isOnline ? "Çevrimiçi" : "Çevrimdışı";

            kisilerListesiContainer.innerHTML += `
                <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f2f5;">
                    <div style="position: relative;">
                        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" style="width: 45px; height: 45px; border-radius: 50%;">
                        <span style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background-color: ${durumRengi}; border: 2px solid white; border-radius: 50%;"></span>
                    </div>
                    <div style="margin-left: 15px; display: flex; flex-direction: column;">
                        <span style="font-size: 16px; font-weight: 500; color: #111b21;">${isim}</span>
                        <span style="font-size: 13px; color: ${durumRengi};">${durumYazisi}</span>
                    </div>
                </div>
            `;
        });
    }

    // =========================================================
    // SİHİRLİ KISIM: SIGNALR İLE ANLIK DURUM GÜNCELLEMESİ YAKALAMA
    // =========================================================
    if (connection) {
        connection.on("KullaniciDurumDegisti", (kullaniciId, isOnline) => {
            const kisiIndex = aktifKisilerVerisi.findIndex(k => k.id === kullaniciId || k.Id === kullaniciId);
            if (kisiIndex !== -1) {
                aktifKisilerVerisi[kisiIndex].cevrimiciMi = isOnline;
                
               
                if (kisilerModal.style.display === "block") {
                    kisileriEkranaCiz(aktifKisilerVerisi);
                }
            }
        });
    }
    // =========================================================
    // --- WHATSAPP TARZI HİBRİT ARAMA SİSTEMİ (DEBOUNCE) ---
    // =========================================================

    let aramaZamanlayici; 
    const solAramaInput = document.getElementById("left-search-input"); // Kendi arama input id'ni buraya yaz!

    // Tıklanabilir olması için fonksiyonları globale ekliyoruz
    // ARAMA SONUÇLARINDAN BİR KİŞİYE TIKLANDIĞINDA ÇALIŞACAK ANA FONKSİYON
    window.kisiyleSohbetBaslat = async function(hedefKullaniciId) {
        try {
            // C# API'sine hedef kişinin ID'sini gönderiyoruz (Varsa getir, yoksa oluştur)
            const response = await fetch(`/api/sohbetler/birebir/${hedefKullaniciId}`, {
                method: "POST",
               credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
            });

            if (response.ok) {
                const data = await response.json();
                
                // Arama kutusunu gizle, orijinal listeyi aç (Ekranı temizliyoruz)
                document.getElementById("search-results-container").style.display = "none";
                document.getElementById("chat-list").style.display = "block";
                document.getElementById("left-search-input").value = "";
                
                if (data.yeniMi) {
                    // Eğer sistem yepyeni bir sohbet oluşturduysa, sol menünün güncellenmesi için sayfayı yenilemek en sağlıklısı
                    window.location.reload(); 
                } else {
                    // ZATEN SOHBET VARSA: Hiç yenilemeden doğrudan hedef sohbetin içine pürüzsüz geçiş yap!
                    // (Sohbet adını sol menüden çalarak animasyonu hızlandırıyoruz)
                    const sohbetKutusu = document.querySelector(`.chat-item[data-id='${data.sohbetId}'] h4`);
                    const sohbetAdi = sohbetKutusu ? sohbetKutusu.textContent : "Sohbet";
                    
                    await window.sohbetiAc(data.sohbetId, sohbetAdi);
                }
            } else {
                const hata = await response.text();
                alert("Sohbet başlatılamadı: " + hata);
            }
        } catch (err) {
            console.error("Kişiyle sohbet başlatılırken hata oluştu:", err);
        }
    };

    if (solAramaInput) {
        solAramaInput.addEventListener("input", (e) => {
            clearTimeout(aramaZamanlayici); // Debounce mantığı: Beklemeyi sıfırla
            
            const kelime = e.target.value.trim();
            const sohbetListesiKapsayici = document.getElementById("chat-list"); 
            const aramaSonuclariKapsayici = document.getElementById("search-results-container"); // HTML'de arama inputunun altında olmalı!

            if (kelime.length < 2) {
                if(aramaSonuclariKapsayici) aramaSonuclariKapsayici.style.display = "none";
                if(sohbetListesiKapsayici) sohbetListesiKapsayici.style.display = "block";
                return;
            }

            aramaZamanlayici = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/sohbetler/ara?kelime=${kelime}`, {
                        credentials: "include", 
headers: { 
    "Content-Type": "application/json" 
}
                    });

                    if (response.ok) {
                        const veri = await response.json();
                        
                        if(sohbetListesiKapsayici) sohbetListesiKapsayici.style.display = "none";
                        if(aramaSonuclariKapsayici) {
                            aramaSonuclariKapsayici.style.display = "block";
                            aramaSonuclariniEkranaCiz(veri, kelime, aramaSonuclariKapsayici);
                        }
                    }
                } catch (error) {
                    console.error("Arama hatası:", error);
                }
            }, 300); // 300ms bekle
        });
    }

   
    function aramaSonuclariniEkranaCiz(veri, arananKelime, kapsayici) {
        kapsayici.innerHTML = "";

        const regex = new RegExp(`(${arananKelime})`, "gi");
        const vurgula = (metin) => metin.replace(regex, `<span class="search-highlight">$1</span>`);

        // Tıklamalarda tırnak (') hatası çıkmaması için güvenli formata çeviriyoruz
        const guvenliKelime = arananKelime.replace(/'/g, "\\'");

        let html = "";

        // 1. SOHBETLER
        if (veri.sohbetler && veri.sohbetler.length > 0) {
            html += `<div class="search-section-label">Sohbetler</div>`;
            veri.sohbetler.forEach(s => {
                html += `
                <div class="search-result-item type-sohbet" onclick="window.sohbetiAc(${s.id}, '${s.ad.replace(/'/g, "\\'")}')">
                    <div class="search-result-icon"><i class="fas fa-users"></i></div>
                    <div class="search-result-name">${vurgula(s.ad)}</div>
                </div>`;
            });
        }

        // 2. KİŞİLER
        if (veri.kisiler && veri.kisiler.length > 0) {
            html += `<div class="search-section-label">Kişiler</div>`;
            veri.kisiler.forEach(k => {
                html += `
                <div class="search-result-item type-kisi" onclick="window.kisiyleSohbetBaslat(${k.id})">
                    <div class="search-result-icon"><i class="fas fa-user"></i></div>
                    <div class="search-result-name">${vurgula(k.ad)}</div>
                </div>`;
            });
        }

        // 3. MESAJLAR (SOHBET ADI DAHİL)
        if (veri.mesajlar && veri.mesajlar.length > 0) {
            html += `<div class="search-section-label">Mesajlar</div>`;
            veri.mesajlar.forEach(m => {
                let kisaIcerik = m.icerik.length > 45 ? m.icerik.substring(0, 45) + "..." : m.icerik;

                // SİHİRLİ DOKUNUŞ: C#'ı yormadan sol menüde zaten var olan sohbet adını JS ile anında çalıyoruz :)
                const sohbetKutusu = document.querySelector(`.chat-list .chat-item[data-id='${m.sohbetId}'] h4`);
                const sohbetAdi = sohbetKutusu ? sohbetKutusu.textContent : "Sohbet";

                html += `
                <div class="search-result-item type-mesaj" onclick="window.hedefMesajaGit(${m.sohbetId}, ${m.id}, '${guvenliKelime}')">
                    <div style="display:flex; align-items:center; gap:10px; width:100%;">
                        <div class="search-result-icon"><i class="fas fa-comment-dots"></i></div>
                        <span class="search-result-msg-source"><i class="fas fa-thumbtack"></i>${sohbetAdi}</span>
                    </div>
                    <span class="search-result-msg-snippet">${vurgula(kisaIcerik)}</span>
                </div>`;
            });
        }

        if (html === "") {
            html = `
            <div class="search-empty-state">
                <i class="fas fa-magnifying-glass"></i>
                <span><strong>"${arananKelime}"</strong> için sonuç bulunamadı.</span>
            </div>`;
        }
        kapsayici.innerHTML = html;
    }

    // GÜNCELLENDİ: SADECE KELİMEYİ SALİSELİK BOYAYAN ANİMASYON
    window.hedefMesajaGit = async function(sohbetId, mesajId, arananKelime) {
        await window.sohbetiAc(sohbetId); 
        
        setTimeout(() => {
            const hedefMesajDiv = document.querySelector(`[data-mesajid='${mesajId}']`);
            if (hedefMesajDiv) {
                // Ekranda ortalayacak şekilde kaydır
                hedefMesajDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Mesajın metnini tutan <p> etiketini bul
                const pEtiketi = hedefMesajDiv.querySelector("p");
                
                if (pEtiketi && arananKelime) {
                    const orijinalMetin = pEtiketi.innerHTML;
                    const regex = new RegExp(`(${arananKelime})`, "gi");
                    
                    // Sadece o kelimeyi parlak sarı, gölgeli ve kalın yapan geçici bir <span> ile sar
                    pEtiketi.innerHTML = orijinalMetin.replace(regex, `<span class="flash-highlight" style="background-color: #ffc107; color: #000; font-weight: bold; padding: 2px 4px; border-radius: 4px; box-shadow: 0 0 8px #ffc107; transition: all 1s ease;">$1</span>`);
                    
                    // 1.5 Saniye bekleyip yavaşça sönme efekti ver
                    setTimeout(() => {
                        const highlights = pEtiketi.querySelectorAll('.flash-highlight');
                        highlights.forEach(h => {
                            h.style.backgroundColor = "transparent";
                            h.style.boxShadow = "none";
                            h.style.color = "inherit"; // Eski renge dön
                        });

                        // Animasyon bitince orijinal HTML'i geri koy (DOM temiz kalsın)
                        setTimeout(() => { pEtiketi.innerHTML = orijinalMetin; }, 1000);
                    }, 1500);
                    
                } else {
                    // Kelime odaklı vurgu yapılamazsa fallback olarak tüm div'i boya
                    const orjinalRenk = hedefMesajDiv.style.backgroundColor;
                    hedefMesajDiv.style.backgroundColor = "#dcf8c6"; 
                    hedefMesajDiv.style.transition = "background-color 0.5s ease"; 
                    
                    setTimeout(() => {
                        hedefMesajDiv.style.backgroundColor = orjinalRenk;
                        setTimeout(() => { hedefMesajDiv.style.transition = ""; }, 500);
                    }, 1500);
                }
            }
        }, 500); // Mesajların render olması için 500ms bekle
    };
}); 

