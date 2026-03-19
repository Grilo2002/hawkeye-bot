# 🦅 HawkEye Ultimate — Setup Guide

---

## 📁 Project Structure

```
hawkeye_ultimate/
├── bot.py                  ← Main bot entry point
├── modules/
│   ├── phone_lookup.py     ← Phone ID: GetContact + Truecaller + NumVerify
│   ├── transliterate.py    ← Name translation → Hebrew
│   ├── vehicle.py          ← Car/bike lookup (data.gov.il)
│   ├── facebook.py         ← Facebook by phone (local CSV)
│   ├── lawyer.py           ← Lawyer search (local XLSX)
│   ├── accountant.py       ← Accountant search (data.gov.il)
│   ├── imei.py             ← IMEI device identification
│   ├── dog_owner.py        ← Dog owner search (Agriculture Ministry)
│   ├── username.py         ← Username / web search
│   ├── alpha.py            ← ALPHA: all categories at once
│   └── image_analysis.py   ← AI image analysis + reverse image search
├── data/
│   ├── Facebook.csv        ← Place your Facebook CSV here
│   └── lawyers.xlsx        ← Place lawyers.xlsx here (included in GodEye zip)
├── requirements.txt
├── .env.example
└── SETUP.md
```

---

## ✅ Step 1 — Python & Dependencies

Requires Python 3.10+

```bash
pip install -r requirements.txt
```

> 💡 If you don't need AI image analysis, comment out the last 4 lines in `requirements.txt` to avoid the large PyTorch download.

---

## ✅ Step 2 — Create Telegram Bot

1. Open Telegram → search **@BotFather**
2. `/newbot` → set name to `HawkEye` and username to `HawkEyeBot`
3. Copy the token

---

## ✅ Step 3 — NumVerify (Free, 2 min)

1. Go to https://numverify.com → **Get Free API Key**
2. Copy your **API Access Key**

---

## ✅ Step 4 — GetContact Credentials ⭐ MOST IMPORTANT

GetContact aggregates names from Drupe, Eyecon, Me, Truecaller.
You need **TOKEN** and **FINAL_KEY** from the app's private storage.

### Method A — Android Emulator (recommended, no root needed)

1. Install **Android Studio**: https://developer.android.com/studio
2. Create a Virtual Device: **Pixel 4, Android 10, NO Google Play**
3. Download GetContact APK from https://apkpure.com
4. Drag APK onto emulator → open app → log in with your phone number
5. In Android Studio: **View → Tool Windows → Device Explorer**
6. Navigate to:
   `/data/data/app.source.getcontact/shared_prefs/GetContactSettingsPref.xml`
7. Save and open the file, find:
   ```xml
   <string name="TOKEN">COPY_THIS</string>
   <string name="FINAL_KEY">COPY_THIS</string>
   ```

### Method B — Rooted Android

```bash
adb shell su -c "cat /data/data/app.source.getcontact/shared_prefs/GetContactSettingsPref.xml"
```

---

## ✅ Step 5 — Truecaller Credentials (Optional)

Same process as Step 4 but:
```
/data/data/com.truecaller/shared_prefs/com.truecaller.android.prefs.xml
```
Find: `<string name="installationId">COPY_THIS</string>`

---

## ✅ Step 6 — Place Data Files

```bash
mkdir -p data
# Copy your Facebook.csv into data/
# Copy lawyers.xlsx from the GodEye zip into data/
cp /path/to/Facebook.csv data/
cp /path/to/lawyers.xlsx data/
```

---

## ✅ Step 7 — Configure .env

```bash
cp .env.example .env
# Edit .env with your values
```

---

## ✅ Step 8 — Run

```bash
export $(cat .env | xargs)
python bot.py
```

---

## 🦅 Features

| Feature | Source | Data |
|---|---|---|
| 📞 Phone ID | GetContact + Truecaller | Live API |
| 🔤 Hebrew translation | Built-in | Latin/Arabic/Cyrillic → Hebrew |
| 🚗 Vehicle lookup | data.gov.il | Cars + bikes |
| 👤 Facebook by phone | Local CSV | Facebook.csv (2020 leak) |
| ⚖️ Lawyer search | Local XLSX | lawyers.xlsx (up to 2023) |
| 📊 Accountant search | data.gov.il | Live API |
| 📱 IMEI lookup | imeicheck.com | Live API |
| 🐶 Dog owner | Agriculture Ministry | Live scrape |
| 🔍 Username search | InstantUsername / Webmii | Links |
| 🖼️ Image analysis | BLIP + YOLOv5 + reverse search | Local AI |
| 🦅 ALPHA | All of the above | Combined |

---

## 🚀 Run 24/7

### Railway (free)
1. Push to GitHub
2. https://railway.app → New Project → Deploy from GitHub
3. Set environment variables in Railway dashboard

### systemd
```bash
sudo nano /etc/systemd/system/hawkeye.service
```
```ini
[Unit]
Description=HawkEye Ultimate Bot
After=network.target

[Service]
WorkingDirectory=/path/to/hawkeye_ultimate
EnvironmentFile=/path/to/hawkeye_ultimate/.env
ExecStart=/usr/bin/python3 bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable hawkeye && sudo systemctl start hawkeye
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| GetContact empty | Token expired — re-extract from app |
| Truecaller 401 | installationId expired — re-extract |
| `ModuleNotFoundError: Crypto` | `pip install pycryptodome` |
| Facebook/Lawyers not found | Check paths in `.env` |
| Dog search fails | Chrome/chromedriver not installed — `apt install chromium-driver` |
| Image AI slow | Normal on first run (downloads ~1.5GB models) |
| Bot not responding | Check TELEGRAM_TOKEN |
