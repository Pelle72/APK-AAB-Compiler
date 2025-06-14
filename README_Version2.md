# Bubblewrap APK/AAB Generator – Bygg Android APK från PWA eller lokal ZIP – utan Android Studio

Detta projekt innehåller ett Node.js-script och en Express-server som låter dig:
- **Konvertera en Progressive Web App (PWA) till Android APK/AAB via manifest-URL**
- **ELLER ladda upp din webapp som ZIP-fil** och bygga APK/AAB direkt

Du behöver **inte** installera Android Studio. Endast kommandoradsverktyg och Bubblewrap krävs.

---

## Minimala krav för att bygga APK/AAB

**Installera följande:**

1. **Node.js**  
   - Version: ≥ 12.x  
   - [Ladda ner Node.js](https://nodejs.org/)

2. **Java JDK**  
   - Version: 11 eller 17 (rekommenderas: OpenJDK 17)  
   - [Ladda ner OpenJDK](https://adoptium.net/)

3. **Android SDK Command-line Tools**  
   - [Ladda ner här (Command line tools only)](https://developer.android.com/studio#command-tools)
   - **SDK-komponenter som krävs:**  
     - platform-tools  
     - build-tools (t.ex. 34.0.0)  
     - platforms (t.ex. android-34)

4. **Miljövariabler**  
   - `ANDROID_HOME` måste peka på din SDK-mapp, t.ex:
     ```
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
     ```

5. **Bubblewrap CLI**  
   - Installera globalt:
     ```
     npm install -g @bubblewrap/cli
     ```

---

### Installera Android SDK-komponenter

Efter att du laddat ner och packat upp command line tools:

```bash
cd $ANDROID_HOME/cmdline-tools/latest/bin
./sdkmanager --licenses
./sdkmanager --install "platform-tools" "build-tools;34.0.0" "platforms;android-34"
```

---

## Vad gör koden?

- **Via manifest-URL:** Tar emot PWA-manifestets URL och packageId via formulär eller API, bygger APK/AAB.
- **Via ZIP-uppladdning:** Ladda upp en ZIP med din webapp (måste innehålla manifest.json). Servern extraherar, letar rätt på manifestet och bygger APK/AAB.
- Returnerar katalogvägar till APK/AAB (kan vidareutvecklas till direkta nedladdningslänkar).

---

## Hur kör jag?

1. **Se till att alla minimikrav är installerade (se ovan).**
2. **Installera Node-moduler:**
   ```bash
   npm install
   ```
3. **Starta servern:**
   ```bash
   node server.js
   ```
4. **Surfa till [http://localhost:3000/](http://localhost:3000/) och följ instruktionerna**  
   - Fyll i din manifest-URL eller ladda upp ZIP-arkiv med din webapp.

---

## Exempelformulär

- **Generera APK/AAB från manifest-URL**
- **ELLER ladda upp din ZIP-packade webapp**

---

## Felsökning

- Kontrollera att `JAVA_HOME` och `ANDROID_HOME` är rätt satta.
- Kontrollera att alla SDK-kommandon fungerar i terminalen.
- Om Bubblewrap klagar på saknade verktyg: installera dem med `sdkmanager` enligt ovan.
- Kontrollera behörigheter för uppladdningar och att temp-mappar kan skapas.

---

## Vidareutveckling

- Lägg till nedladdningslänkar till APK/AAB-filer i frontend.
- Bygg ut med autentisering eller köhantering om det blir många användare.
- Lägg till valmöjligheter för ikon/splash eller signering av APK.

---

**Lycka till med APK-genereringen!**