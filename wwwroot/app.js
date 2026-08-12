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
   
    // --- 1. BLOK: SOHBET LİSTESİ GETİRME ---
async function sohbetleriGetir() {
    try {
        const kullaniciId = aktifKullanici.id;
        if (!kullaniciId) return console.error("Kullanıcı ID bulunamadı!");

        const response = await fetch(`/api/sohbetler/kullanici/${kullaniciId}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) return apiHatasiniYonet(response.status);

        const sohbetler = await response.json();
        chatList.innerHTML = ""; 

        if (sohbetler.length === 0) {
            chatList.innerHTML = "<p style='padding: 15px; color: #667781; text-align: center; font-size: 14px;'>Henüz hiç sohbet odası yok.</p>";
            return;
        }

        sohbetler.forEach(sohbet => {
            const chatItem = sohbetItemOlustur(sohbet, kullaniciId);
            chatList.appendChild(chatItem);
        });

    } catch (error) {
        console.error("🚨 Sunucuya bağlanırken hata oluştu:", error);
    }
}

// Yardımcı Metot 1: Hata Yönetimi
function apiHatasiniYonet(status) {
    console.error("🚨 API Hatası:", status);
    if (status === 401) {
        alert("Oturumunuzun süresi dolmuş veya Çerez (Cookie) alınamamış. Lütfen tekrar giriş yapın!");
        localStorage.removeItem("kullanici");
        window.location.href = "login.html";
    }
}

// Yardımcı Metot 2: Sohbet Kutusunu Çizme
function sohbetItemOlustur(sohbet, kullaniciId) {
    const chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    chatItem.dataset.id = sohbet.id; 

    const badgeHtml = sohbet.okunmamisMesajSayisi > 0 ? `<div class="unread-badge">${sohbet.okunmamisMesajSayisi}</div>` : "";
    let onizleme = htmlGuvenliYap(sohbetOnizlemeHazirla(sohbet, kullaniciId));
    const grupAdi = sohbet.grupadi || sohbet.grupAdi || sohbet.GrupAdi || "İsimsiz Sohbet";
        
    chatItem.innerHTML = `
        <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Grup" class="profile-pic">
        <div class="chat-details">
            <div class="chat-title">
                <h4>${grupAdi}</h4>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="time">-</span>
                    ${badgeHtml}
                </div>
            </div>
            <div class="chat-last-message"><p>${onizleme}</p></div>
        </div>
    `;
    return chatItem;
}

// Yardımcı Metot 3: Mesaj Önizleme Mantığı
function sohbetOnizlemeHazirla(sohbet, kullaniciId) {
    let onizleme = sohbet.sonMesajIcerik || "Henüz mesaj yok...";
    if (onizleme === "Henüz mesaj yok...") return onizleme;

    const gidenMesajId = sohbet.sonMesajGonderenId || sohbet.SonMesajGonderenId || 0;
    if (Number(gidenMesajId) === Number(kullaniciId) && Number(gidenMesajId) !== 0) {
        onizleme = `Siz: ${onizleme}`;
    } else if (sohbet.grupmu && sohbet.sonMesajGonderenAd) {
        let kisaAd = sohbet.sonMesajGonderenAd.split(' ')[0];
        onizleme = `~${kisaAd}: ${onizleme}`;
    }

    return onizleme.length > 35 ? onizleme.substring(0, 35) + "..." : onizleme;
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

    // --- 1. BLOK: MESAJ GEÇMİŞİNİ GETİRME ---
async function mesajlariGetir(sohbetId, yukariKaydirmaMi = false) {
    if (yukariKaydirmaMi && (mesajlarYukleniyor || !dahaFazlaMesajVarMi)) return;
    mesajlarYukleniyor = true;

    mesajYuklemeArayuzunuHazirla(yukariKaydirmaMi);

    try {
        const limit = 20;
        const response = await fetch(`/api/mesajlar/sohbet/${sohbetId}?sayfa=${suAnkiSayfa}&limit=${limit}`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            const mesajlar = await response.json();
            await mesajListesiniEkranaBas(mesajlar, yukariKaydirmaMi, limit);
        }
    } catch (error) {
        console.error("Mesajlar çekilirken hata:", error);
    }
    mesajlarYukleniyor = false;
}

// Yardımcı 1: Yükleme Arayüzü (Loader)
function mesajYuklemeArayuzunuHazirla(yukariKaydirmaMi) {
    if (!yukariKaydirmaMi) {
        messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'><i class='fas fa-spinner fa-spin'></i> Yükleniyor...</p>";
        suAnkiSayfa = 1;
        dahaFazlaMesajVarMi = true;
    } else {
        const loader = document.createElement("div");
        loader.id = "eski-mesaj-loader";
        loader.innerHTML = "<p style='text-align:center; color:#888; font-size:12px; margin:5px;'>Eski mesajlar yükleniyor...</p>";
        messagesContainer.prepend(loader);
    }
}

// Yardımcı 2: Gelen Mesajları Ekrana Basma
async function mesajListesiniEkranaBas(mesajlar, yukariKaydirmaMi, limit) {
    if (!yukariKaydirmaMi) {
        messagesContainer.innerHTML = "";
    } else {
        document.getElementById("eski-mesaj-loader")?.remove();
    }

    if (mesajlar.length === 0 && !yukariKaydirmaMi) {
        messagesContainer.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>Burada henüz hiç mesaj yok. İlk mesajı sen gönder!</p>";
        return;
    }

    if (mesajlar.length < limit) dahaFazlaMesajVarMi = false;

    const eskiScrollYuksekligi = messagesContainer.scrollHeight;
    if (yukariKaydirmaMi) mesajlar.reverse();

    mesajlar.forEach(m => islenmisMesajiEkle(m, yukariKaydirmaMi));

    sohbetBasiEtiketiniEkle();
    scrollKonumunuAyarla(yukariKaydirmaMi, eskiScrollYuksekligi);
    suAnkiSayfa++;
}

// Yardımcı 3: Tekil Mesaj İşleme
function islenmisMesajiEkle(m, yukariKaydirmaMi) {
    const gonderenId = m.gonderenid || m.Gonderenid || m.kullaniciid;
    const benMiyim = (Number(gonderenId) === Number(benimKullaniciIdm));
    const metin = m.icerik || m.Icerik || m.mesaj || m.MesajMetni;
    
    const hamTarih = m.gondermeTarihi || m.GondermeTarihi || m.gonderilmetarihi;
    let saatString = "";
    if (hamTarih) {
        saatString = new Date(hamTarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const gonderenKisiAdi = m.gonderenAd || m.GonderenAd || m.KullaniciAdi || "";
    const dosyaLink = m.dosyaYolu || m.DosyaYolu || null;
    
    ekranaMesajEkle(metin, benMiyim, saatString, gonderenKisiAdi, dosyaLink, m.id || m.Id, yukariKaydirmaMi);
}

// Yardımcı 4: Sohbetin Başı Etiketi
function sohbetBasiEtiketiniEkle() {
    if (!dahaFazlaMesajVarMi && !document.getElementById("sohbet-basi-etiketi")) {
        const sohbetBasi = document.createElement("p");
        sohbetBasi.id = "sohbet-basi-etiketi";
        sohbetBasi.style = "text-align:center; color:#ccc; font-size:11px; margin: 15px 0;";
        sohbetBasi.textContent = "--- Sohbetin Başı ---";
        messagesContainer.prepend(sohbetBasi); 
    }
}

// Yardımcı 5: Scroll (Kaydırma) Çubuğunu Ayarlama
function scrollKonumunuAyarla(yukariKaydirmaMi, eskiScrollYuksekligi) {
    if (yukariKaydirmaMi) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight - eskiScrollYuksekligi;
    } else {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

    // SCROLL OLAYINI DİNLEYEN TETİKLEYİCİ (YENİ)
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

 
   
    // --- 2. BLOK: MESAJ GÖNDERME ---
async function mesajGonder(zorlaOku = false) { 
    const metin = messageInput.value.trim();
    if (!metin && !seciliDosya) return;
    
    if (!aktifSohbetId) return alert("Lütfen mesaj göndermeden önce sol taraftan bir sohbete tıklayın!");

    messageInput.value = ""; // Kutuyu temizle
    let yuklenenDosyaYolu = null;

    if (seciliDosya) {
        yuklenenDosyaYolu = await sunucuyaDosyaYukle();
        if (!yuklenenDosyaYolu) return; // Dosya yüklenemezse işlemi kes
    }

    await mesajVeritabaninaKaydet(metin, yuklenenDosyaYolu, zorlaOku);
}

// Yardımcı Metot 1: Dosya Yükleme
async function sunucuyaDosyaYukle() {
    const formData = new FormData();
    formData.append("file", seciliDosya);
    formData.append("sohbetId", aktifSohbetId);
    formData.append("gonderenId", benimKullaniciIdm);

    try {
        const uploadRes = await fetch("/api/dosyalar/yukle", {
            method: "POST",
            credentials: "include", 
            body: formData
        });
        
        if (uploadRes.ok) {
            const sonuc = await uploadRes.json();
            seciliDosya = null;
            document.getElementById("dosya-onizleme-kutusu")?.setAttribute("style", "display: none;");
            return sonuc.dosyaYolu; 
        } else {
            alert("Uyarı: " + await uploadRes.text());
            return null;
        }
    } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        return null;
    }
}

// Yardımcı Metot 2: Mesajı Kaydetme ve Arayüzü Güncelleme
async function mesajVeritabaninaKaydet(metin, dosyaYolu, zorlaOku) {
    try {
        const response = await fetch("/api/mesajlar", {
            method: "POST",
            credentials: "include", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sohbetid: parseInt(aktifSohbetId),
                icerik: metin || "📁 Dosya gönderildi",
                gonderenid: benimKullaniciIdm, 
                gondermeTarihi: new Date().toISOString(),
                dosyaYolu: dosyaYolu
            })
        });

        if (response.ok) {
            mesajGonderimSonrasiUI(metin, dosyaYolu, zorlaOku);
        } else {
            alert("Mesaj gönderilemedi: " + response.status);
        }
    } catch (error) {
        console.error("🚨 Sunucuya ulaşılamadı:", error);
    }
}

// Yardımcı Metot 3: Arayüz ve TTS Tetikleme
function mesajGonderimSonrasiUI(metin, dosyaYolu, zorlaOku) {
    const suAn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ekranaMesajEkle(metin || "📁 Dosya gönderildi", true, suAn, "", dosyaYolu);

    const solSohbetKutusu = document.querySelector(`.chat-item[data-id='${aktifSohbetId}']`);
    if (solSohbetKutusu) {
        const sonMesajP = solSohbetKutusu.querySelector(".chat-last-message p");
        if (sonMesajP) sonMesajP.innerHTML = `Siz: ${htmlGuvenliYap(metin) || "📁 Dosya"}`;
        document.getElementById("chat-list")?.prepend(solSohbetKutusu);
    }

    const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
    if (zorlaOku || (ayarlar && ayarlar.otomatikOku === true)) {
        metniSeslendir(metin || "Dosya gönderildi");
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
    if (benMiyim) return; // Kendi mesajlarımızı zaten arayüzden manuel ekliyoruz

    const mesajDetay = mesajDetaylariniCikar(mesaj);

    if (mesaj.sohbetid == aktifSohbetId) {
        aktifSohbetMesajiniYonet(mesaj.sohbetid, mesajDetay);
    } else {
        solMenuyuGuncelle(mesaj.sohbetid, mesajDetay.gonderenKisiAdi, mesajDetay.guvenliMetin, true);
    }
});

// Yardımcı 1: Gelen Mesajın Verilerini Ayrıştırma
function mesajDetaylariniCikar(mesaj) {
    const metin = mesaj.icerik || mesaj.Icerik || mesaj.mesaj;
    const guvenliMetin = htmlGuvenliYap(metin);
    const hamTarih = mesaj.gondermeTarihi || mesaj.GondermeTarihi;
    const saatString = hamTarih ? new Date(hamTarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const gonderenKisiAdi = mesaj.gonderenAd || mesaj.GonderenAd || "Bilinmeyen";
    const dosyaLink = mesaj.dosyaYolu || mesaj.DosyaYolu || null;
    
    return { metin, guvenliMetin, saatString, gonderenKisiAdi, dosyaLink };
}

// Yardımcı 2: Kullanıcı Şu An O Sohbetin İçindeyse
function aktifSohbetMesajiniYonet(sohbetId, detay) {
    ekranaMesajEkle(detay.metin, false, detay.saatString, detay.gonderenKisiAdi, detay.dosyaLink);
    
    // Okundu bilgisi gönder
    fetch(`/api/sohbetler/${sohbetId}/okundu-isaretle`, { 
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } 
    }).catch(err => console.error(err));

    const ayarlar = JSON.parse(localStorage.getItem("ttsAyarlari"));
    if (ayarlar?.otomatikOku === true) metniSeslendir(detay.metin);

    solMenuyuGuncelle(sohbetId, detay.gonderenKisiAdi, detay.guvenliMetin, false);
}

// Yardımcı 3: Sol Menüyü ve Rozeti (Badge) Güncelleme
function solMenuyuGuncelle(sohbetId, gonderenKisiAdi, guvenliMetin, rozetArtir) {
    const solSohbetKutusu = document.querySelector(`.chat-item[data-id='${sohbetId}']`);
    if (!solSohbetKutusu) return;

    const sonMesajP = solSohbetKutusu.querySelector(".chat-last-message p");
    if (sonMesajP) {
        const kisaAd = gonderenKisiAdi.split(' ')[0];
        sonMesajP.innerHTML = `<span style="color:var(--brand); font-weight:600;">~${kisaAd}:</span> ${guvenliMetin || "📁 Dosya"}`;
    }

    if (rozetArtir) rozetEtiketiniGuncelle(solSohbetKutusu);

    // Güncellenen sohbeti listenin en üstüne taşı
    document.getElementById("chat-list")?.prepend(solSohbetKutusu);
}

// Yardımcı 4: Okunmamış Mesaj Balonu (Badge) Sayacı
function rozetEtiketiniGuncelle(solSohbetKutusu) {
    let rozet = solSohbetKutusu.querySelector(".unread-badge");
    if (rozet) {
        rozet.textContent = (parseInt(rozet.textContent) || 0) + 1;
    } else {
        const titleDiv = solSohbetKutusu.querySelector(".chat-title > div");
        if (titleDiv) titleDiv.innerHTML += `<div class="unread-badge">1</div>`;
    }
}
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
    const solAramaInput = document.getElementById("left-search-input"); // Kendi arama input id

  
    window.kisiyleSohbetBaslat = async function(hedefKullaniciId) {
        try {
            // C# API'sine hedef kişinin ID'sini gönderiyoruz 
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

   
    // --- 3. BLOK: ARAMA SONUÇLARINI ÇİZME ---
function aramaSonuclariniEkranaCiz(veri, arananKelime, kapsayici) {
    kapsayici.innerHTML = "";
    const guvenliKelime = arananKelime.replace(/'/g, "\\'");
    let html = "";

    html += sohbetSonuclariniOlustur(veri.sohbetler, arananKelime);
    html += kisiSonuclariniOlustur(veri.kisiler, arananKelime);
    html += mesajSonuclariniOlustur(veri.mesajlar, arananKelime, guvenliKelime);

    if (html === "") {
        html = `
        <div class="search-empty-state">
            <i class="fas fa-magnifying-glass"></i>
            <span><strong>"${arananKelime}"</strong> için sonuç bulunamadı.</span>
        </div>`;
    }
    kapsayici.innerHTML = html;
}

// Yardımcı Metot 1: Kelime Vurgulama
function kelimeVurgula(metin, arananKelime) {
    const regex = new RegExp(`(${arananKelime})`, "gi");
    return metin.replace(regex, `<span class="search-highlight">$1</span>`);
}

// Yardımcı Metot 2: Sohbet Listesi HTML
function sohbetSonuclariniOlustur(sohbetler, arananKelime) {
    if (!sohbetler || sohbetler.length === 0) return "";
    let html = `<div class="search-section-label">Sohbetler</div>`;
    sohbetler.forEach(s => {
        html += `
        <div class="search-result-item type-sohbet" onclick="window.sohbetiAc(${s.id}, '${s.ad.replace(/'/g, "\\'")}')">
            <div class="search-result-icon"><i class="fas fa-users"></i></div>
            <div class="search-result-name">${kelimeVurgula(s.ad, arananKelime)}</div>
        </div>`;
    });
    return html;
}

// Yardımcı Metot 3: Kişi Listesi HTML
function kisiSonuclariniOlustur(kisiler, arananKelime) {
    if (!kisiler || kisiler.length === 0) return "";
    let html = `<div class="search-section-label">Kişiler</div>`;
    kisiler.forEach(k => {
        html += `
        <div class="search-result-item type-kisi" onclick="window.kisiyleSohbetBaslat(${k.id})">
            <div class="search-result-icon"><i class="fas fa-user"></i></div>
            <div class="search-result-name">${kelimeVurgula(k.ad, arananKelime)}</div>
        </div>`;
    });
    return html;
}

// Yardımcı Metot 4: Mesaj Listesi HTML
function mesajSonuclariniOlustur(mesajlar, arananKelime, guvenliKelime) {
    if (!mesajlar || mesajlar.length === 0) return "";
    let html = `<div class="search-section-label">Mesajlar</div>`;
    mesajlar.forEach(m => {
        let kisaIcerik = m.icerik.length > 45 ? m.icerik.substring(0, 45) + "..." : m.icerik;
        const sohbetKutusu = document.querySelector(`.chat-list .chat-item[data-id='${m.sohbetId}'] h4`);
        const sohbetAdi = sohbetKutusu ? sohbetKutusu.textContent : "Sohbet";

        html += `
        <div class="search-result-item type-mesaj" onclick="window.hedefMesajaGit(${m.sohbetId}, ${m.id}, '${guvenliKelime}')">
            <div style="display:flex; align-items:center; gap:10px; width:100%;">
                <div class="search-result-icon"><i class="fas fa-comment-dots"></i></div>
                <span class="search-result-msg-source"><i class="fas fa-thumbtack"></i>${sohbetAdi}</span>
            </div>
            <span class="search-result-msg-snippet">${kelimeVurgula(kisaIcerik, arananKelime)}</span>
        </div>`;
    });
    return html;
}

    //KELİMEYİ SALİSELİK BOYAYAN ANİMASYON
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

