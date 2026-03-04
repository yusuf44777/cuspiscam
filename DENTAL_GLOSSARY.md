# 🦷 CuspisCam — Yazılımcılar İçin Diş Hekimliği Sözlüğü

Bu belge, projede kullanılan diş hekimliği terimlerini teknik olmayan bir dille açıklar.
Uygulamanın mantığını kavramak için hepsini okumanızı öneriyorum.

---

## 1. Çeneler (Arches)

İnsan ağzında iki çene vardır:

| Kod             | Türkçe    | İngilizce    | Açıklama                                         |
|-----------------|-----------|--------------|---------------------------------------------------|
| `maxillary`     | Üst Çene  | Maxillary    | Kafatasına sabit olan üst çene kemiği (Maksilla)  |
| `mandibular`    | Alt Çene  | Mandibular   | Hareket eden alt çene kemiği (Mandibula)          |

> **Dosya isimlendirmesinde:** Üst çene → `Max`, Alt çene → `Mand`

---

## 2. Diş Türleri (Tooth Types)

Her çenede sağ ve sol simetrik olmak üzere aynı diş türleri bulunur. Ön taraftan arkaya doğru sıralama:

| Kod              | Türkçe Adı              | Ne İşe Yarar?                                                                 |
|------------------|--------------------------|--------------------------------------------------------------------------------|
| `Central`        | Santral Kesici           | Ağzın tam ortasındaki 2 diş. Isırma/kesme işlevi görür.                       |
| `Lateral`        | Lateral Kesici           | Santral kesicilerin hemen yanındaki dişler. Yine kesme işlevi görür.           |
| `Canine`         | Kanin (Köpek dişi)       | Sivri uçlu, kesici dişlerin yanındaki dişler. Yırtma işlevi görür.            |
| `1stPremolar`    | 1. Premolar (Küçük azı)  | Kaninin arkasındaki ilk öğütücü diş. Çiğnemeye yardımcı olur.                 |
| `2ndPremolar`    | 2. Premolar (Küçük azı)  | İkinci küçük azı dişi. Aynı bölgede, 1. premoların arkasında.                 |
| `1stMolar`       | 1. Molar (Büyük azı)     | İlk büyük azı dişi, en çok çiğneme yapan diş. "6 yaş dişi" olarak da bilinir.|
| `2ndMolar`       | 2. Molar (Büyük azı)     | İkinci büyük azı dişi. "12 yaş dişi" denir.                                   |
| `3rdMolar`       | 3. Molar (Yirmilik diş)  | En arkadaki diş. Genellikle 17-25 yaş arası çıkar, çoğu zaman çekilir.        |

### Görsel sıralama (tek çene, tek taraf):

```
Ön ←──────────────────────────────────── Arka
Central → Lateral → Canine → 1stPremolar → 2ndPremolar → 1stMolar → 2ndMolar → 3rdMolar
  (1)       (2)       (3)        (4)            (5)          (6)        (7)        (8)
```

> Yetişkin bir insanda toplamda **32 diş** vardır (her çenede 16, her tarafta 8).

---

## 3. Diş Yüzeyleri (Surfaces)

Her dişin **5 yüzeyi** vardır. Fotoğraf çekerken hangi yüzeyden baktığımızı belirtiriz:

| Kod  | Kısaltma | Tam Adı                | Açıklama                                                                                  |
|------|----------|------------------------|-------------------------------------------------------------------------------------------|
| `OI` | O/I      | Oklüzal / İnsisal      | **Üst yüzey.** Arka dişlerde (premolar/molar) "oklüzal" = çiğneme yüzeyi. Ön dişlerde (kesici/kanin) "insisal" = kesme kenarı. |
| `M`  | M        | Mesial                 | Dişin ağız ortasına (orta çizgiye) bakan yan yüzeyi. Yani komşu dişe dönük **ön** taraftaki yüzey. |
| `D`  | D        | Distal                 | Dişin ağız ortasından **uzağa** bakan yan yüzeyi. Komşu dişe dönük **arka** taraftaki yüzey. |
| `BF` | B/F      | Bukkal / Fasiyal       | Dişin **yanağa/dudağa** bakan dış yüzeyi. Arka dişlerde "bukkal" (yanak tarafı), ön dişlerde "fasiyal" (yüz tarafı) denir. |
| `LP` | L/P      | Lingual / Palatal      | Dişin **dile/damağa** bakan iç yüzeyi. Alt dişlerde "lingual" (dil tarafı), üst dişlerde "palatal" (damak tarafı) denir. |

### Bir dişi hayal edin (yukarıdan bakış):

```
         Oklüzal / İnsisal (O/I)
              ┌───────┐
              │       │
  Mesial (M)  │  DİŞ  │  Distal (D)
              │       │
              └───────┘
         Bukkal / Fasiyal (B/F)   ← yanak/dudak tarafı
         Lingual / Palatal (L/P)  ← dil/damak tarafı (altta gizli)
```

---

## 4. Dosya İsimlendirme Mantığı

Uygulamada bir fotoğraf çekildiğinde dosya adı şu formatta oluşur:

```
Tooth-{Çene}-{DişTürü}_Surface-{Yüzey}_{Tarih-Saat}.jpg
```

**Örnekler:**

| Dosya Adı                                              | Anlamı                                                    |
|---------------------------------------------------------|-----------------------------------------------------------|
| `Tooth-Max-Central_Surface-OI_20260303-142530.jpg`      | Üst çene, santral kesici, oklüzal/insisal yüzey          |
| `Tooth-Mand-1stMolar_Surface-BF_20260303-143012.jpg`    | Alt çene, 1. molar (büyük azı), bukkal/fasiyal yüzey     |
| `Tooth-Max-Canine_Surface-LP_20260303-143500.jpg`       | Üst çene, kanin (köpek dişi), lingual/palatal yüzey      |

---

## 5. Sık Karşılaşılan Terimler

| Terim            | Açıklama                                                                                       |
|------------------|------------------------------------------------------------------------------------------------|
| **FDI Sistemi**  | Uluslararası diş numaralama sistemi (biz kullanmıyoruz ama duyabilirsiniz). Her dişe 2 haneli numara verir (ör. 11 = üst sağ santral). |
| **Ark (Arch)**   | Çene anlamında. Dişlerin oluşturduğu kemer şeklindeki yapı.                                   |
| **Oklüzyon**     | Üst ve alt dişlerin birbirine kapanması/temas etmesi.                                          |
| **Kuron (Crown)**| Dişin diş etinin üzerinde görünen kısmı.                                                       |
| **Kök (Root)**   | Dişin çene kemiği içindeki görünmeyen kısmı.                                                   |
| **Çürük (Caries)**| Dişte bakterilerin neden olduğu yapısal bozulma.                                              |
| **Restorasyon**  | Çürük veya kırık dişin onarılması (dolgu, kaplama vb.).                                        |
| **Periodontal**  | Diş etleri ve dişi destekleyen dokularla ilgili.                                               |
| **Endodontik**   | Diş içi (sinir/kanal) tedavisiyle ilgili. "Kanal tedavisi" buna girer.                        |
| **Protetik**     | Protez (takma diş, köprü, implant üstü kaplama) ile ilgili.                                   |
| **Dental İmplant**| Kaybedilen diş yerine çene kemiğine yerleştirilen titanyum vida.                              |

---

## 6. Uygulama Akışı (Özet)

1. **Çene seç** → Üst (Maxillary) veya Alt (Mandibular)
2. **Diş türü seç** → Dropdown'dan (Central, Lateral, Canine, vb.)
3. **Yüzey seç** → 5 butondan biri (O/I, M, D, B/F, L/P) — bu aşamada kamera açılır
   - Alternatif: Her yüzey butonunun yanındaki **"Galeriden Al"** butonuna basarak, önceden çekilmiş (ör. Samsung Pro mod) bir fotoğrafı içe aktarın
4. **Fotoğraf çek / seç** → Otomatik olarak yerel depolamaya kaydedilir
5. **Senkronize et** → Google Drive'a yükle

---

*Bu belge CuspisCam projesi için hazırlanmıştır. Sorularınız için diş hekiminize danışın 😄*
