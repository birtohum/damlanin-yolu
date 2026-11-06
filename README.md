# Yağmur damlan nereye akar?

**Canlı:** https://birtohum.github.io/damlanin-yolu/

Türkiye haritasında bir yere dokun. Oraya düşen damlanın derelerden nehirlere, oradan denize ya da bir göle kadar izlediği yol çizilir. Sayfa ayrıca yolun uzunluğunu, geçtiği illeri ve ağızdaki ortalama debiyi (model tahmini) gösterir.

## Örnekler

| Başlangıç | Yol | Varış |
|---|---|---|
| Erzurum | Fırat | Basra Körfezi, yaklaşık 2.803 km |
| Kars | Aras ve Kura | Hazar Denizi |
| Sivas | Kızılırmak | Karadeniz, yaklaşık 1.046 km |
| Van | — | Van Gölü (kapalı havza) |
| Konya | — | Konya Ovası'ndaki kapalı havza |

## Veri

- **Akarsular:** [HydroRIVERS v1.0](https://www.hydrosheds.org/products/hydrorivers) (Lehner ve Grill 2013), Avrupa ve Orta Doğu bölümü. Kullanılan parçalar:
  - Türkiye içinde kalan ve yukarı havzası en az 100 km² olan 13.603 parça;
  - bu parçaların denize ya da göle kadar Türkiye dışındaki devamı.
  - Toplam 15.430 parça. Dosya `araclar/hazirla.py` ile üretildi.
- **İl sınırları:** geoBoundaries (CC BY-SA 2.0).

## Sınırlar

- **Akarsu seçimi:** Dokunulan noktaya en yakın büyük akarsu seçilir. Havza sınırına yakın noktalarda sonuç yanılabilir.
- **Hesaba katılmayanlar:** Barajlar, kanallar ve yeraltı suyu hesaba katılmaz.
- **Adlar:** HydroRIVERS'ta nehir adları yok. Bu yüzden yol, geçtiği illerle anlatılır.
- **Varış yeri:** Varılan deniz, ağzın koordinatından basit kurallarla belirlenir.

Kod Apache-2.0 lisanslıdır. Nehir verisi HydroSHEDS lisansıyla, atıf vererek kullanılmıştır.
