#  Real-Time Chat Application

ASP.NET Core, PostgreSQL ve SignalR kullanılarak geliştirilen gerçek zamanlı mesajlaşma uygulamasıdır. Proje; kullanıcı kimlik doğrulama, rol yönetimi, sohbet yönetimi ve gerçek zamanlı mesajlaşma özelliklerini içermektedir. Ayrıca Google Cloud Text-to-Speech (TTS) desteği sayesinde metinler sesli olarak okunabilmektedir.

---

##  Özellikler

###  Authentication & Security
- Kullanıcı kayıt olma (Register)
- Kullanıcı giriş yapma (Login)
- JWT Authentication
- Argon2 ile parola hashleme
- Rol bazlı yetkilendirme (Admin / User)

###  User Management
- Kullanıcı listeleme
- Profil bilgilerini güncelleme
- Kullanıcı silme
- Kullanıcı log kayıtları

###  Chat Management
- Sohbet oluşturma
- Kullanıcıyı sohbete ekleme
- Kullanıcının sohbetlerini listeleme
- Sohbet geçmişini görüntüleme

###  Real-Time Messaging
- SignalR ile anlık mesajlaşma
- SignalR Groups desteği
- Mesajların PostgreSQL'e kaydedilmesi
- JWT korumalı Hub bağlantısı

###  Text-to-Speech
- Google Cloud Text-to-Speech API
- Standart sesler
- Türkçe / İngilizce desteği
- Konuşma hızı ayarlama
- Kadın / Erkek ses seçenekleri
- Manuel ve otomatik seslendirme
- FIFO mesaj kuyruğu
- onended Event Listener ile ses sıralaması

---

#  Kullanılan Teknolojiler

### Backend

- ASP.NET Core
- C#
- Entity Framework Core
- PostgreSQL
- SignalR
- JWT Authentication
- Argon2 Password Hashing

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Fetch API

### DevOps

- Docker
- Docker Compose
- Git
- GitHub

### Cloud

- Google Cloud Text-to-Speech API

---

#  Proje Yapısı

```
STAJ1
│
├── Controllers
├── Data
├── Helpers
├── Hubs
├── Models
├── Repositories
├── Services
├── wwwroot
│   ├── app.js
│   ├── auth.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── style.css
│   └── auth.css
│
├── Program.cs
├── appsettings.json
├── Dockerfile
├── compose.yaml
└── STAJ1.csproj
```

---

#  Uygulama Mimarisi

```
Frontend (HTML/CSS/JS)
        │
        ▼
 ASP.NET Core Controllers
        │
        ▼
     Services
        │
        ▼
 Generic Repository
        │
        ▼
 Entity Framework Core
        │
        ▼
    PostgreSQL
```

Gerçek zamanlı mesajlaşma:

```
Frontend
      │
      ▼
 SignalR Hub
      │
      ▼
 PostgreSQL
```

---

#  Güvenlik

- JWT Authentication
- Role Based Authorization
- Argon2 Password Hashing
- Environment Variables
- API Key Gizleme
- Docker Container Isolation

---

#  Proje Görselleri

- Login Sayfası

  <img width="456" height="491" alt="Ekran görüntüsü 2026-07-27 140818" src="https://github.com/user-attachments/assets/f3382d79-190f-421c-98e1-9d15381cf65b" />


- Register Sayfası

  <img width="425" height="532" alt="Ekran görüntüsü 2026-07-27 140931" src="https://github.com/user-attachments/assets/6bbb08c7-2aae-42c1-b760-77bfd2e02fd8" />


- Sohbet Ekranı

  <img width="1917" height="917" alt="Ekran görüntüsü 2026-07-24 133053" src="https://github.com/user-attachments/assets/a9a75f3f-98dc-4c6e-a7f2-92c7d063b681" />


- Yeni Grup Oluşturma Sayfası

  <img width="383" height="560" alt="image" src="https://github.com/user-attachments/assets/c95265a4-25af-47c5-b833-7cd6f76809c7" />

  
- SignalR Gerçek Zamanlı Mesajlaşma
  
  <img width="1903" height="932" alt="image" src="https://github.com/user-attachments/assets/53e92369-378a-4c6d-9e48-53de09e357a1" />

- Seslendirme Ayarları
  
  <img width="432" height="506" alt="Ekran görüntüsü 2026-07-27 094552" src="https://github.com/user-attachments/assets/44ab5d85-9933-4f36-911f-f1abc98f0fb7" />

- ER Diagram

  <img width="1088" height="693" alt="Ekran görüntüsü 2026-07-27 140257" src="https://github.com/user-attachments/assets/0a9d0c48-9bf6-439d-a25b-3f68c5f0652b" />


---

#  Gelecekte Eklenebilecek Özellikler

- Görüntülü görüşme
- Dosya gönderme
- Bildirim sistemi
- Mesaj silme
- Mesaj düzenleme
- Çevrim içi kullanıcı listesi
- Sesli mesaj




