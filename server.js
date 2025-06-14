const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { generateApkAab } = require('./bubblewrap-generator');

const app = express();
app.use(express.json());
app.use(cors());
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>Bubblewrap APK/AAB Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #f1f3f6;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .container {
      background: #fff;
      padding: 2rem 2.5rem;
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      max-width: 400px;
      width: 100%;
    }
    h2 {
      margin-top: 0;
      font-size: 1.5rem;
      color: #21409a;
      text-align: center;
    }
    label {
      display: block;
      margin-top: 1.1rem;
      color: #555;
      font-weight: bold;
    }
    input[type="text"], input[type="file"] {
      width: 100%;
      padding: 0.6rem;
      margin-top: 0.3rem;
      margin-bottom: 0.8rem;
      border: 1px solid #ccd3e1;
      border-radius: 7px;
      font-size: 1rem;
      background: #f8fafc;
    }
    button {
      width: 100%;
      padding: 0.7rem;
      background: #21409a;
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 1.1rem;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.2s;
    }
    button:hover {
      background: #172a5a;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e6ef;
      margin: 2rem 0 1rem 0;
    }
    .result {
      margin-top: 1.2rem;
      background: #f8fafc;
      border-radius: 7px;
      padding: 1rem;
      color: #21409a;
      font-size: 1rem;
      min-height: 2em;
      word-break: break-word;
    }
    .file-label {
      margin-top: 1.1rem;
      color: #555;
      font-weight: bold;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bubblewrap APK/AAB Generator</h2>
    <form id="convertForm">
      <label>Manifest URL</label>
      <input type="text" name="manifestUrl" placeholder="https://..." required>
      <label>Package ID</label>
      <input type="text" name="packageId" value="com.example.pwa" required>
      <button type="submit">Generera via URL</button>
    </form>
    <hr>
    <form id="uploadForm" enctype="multipart/form-data">
      <label class="file-label">Ladda upp din webapp (.zip)</label>
      <input type="file" name="webapp" accept=".zip" required>
      <label>Package ID</label>
      <input type="text" name="packageId" value="com.example.pwa" required>
      <button type="submit">Ladda upp och bygg!</button>
    </form>
    <div class="result" id="result"></div>
  </div>
  <script>
    // URL-formulär
    document.getElementById('convertForm').onsubmit = async function(e){
      e.preventDefault();
      const manifestUrl = this.manifestUrl.value;
      const packageId = this.packageId.value;
      document.getElementById('result').innerText = "Genererar från URL...";
      const res = await fetch('/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({manifestUrl, packageId})
      });
      const data = await res.json();
      if(data.error) document.getElementById('result').innerText = "Fel: " + data.error;
      else document.getElementById('result').innerText =
        "APK-mapp: " + data.apkPath + "\\nAAB-mapp: " + data.aabPath;
    }
    // ZIP-upload
    document.getElementById('uploadForm').onsubmit = async function(e){
      e.preventDefault();
      const formData = new FormData(this);
      document.getElementById('result').innerText = "Laddar upp och bygger...";
      const res = await fetch('/upload', {
        method:'POST',
        body:formData
      });
      const data = await res.json();
      if(data.error) document.getElementById('result').innerText = "Fel: " + data.error;
      else document.getElementById('result').innerText =
        "APK-mapp: " + data.apkPath + "\\nAAB-mapp: " + data.aabPath;
    }
  </script>
</body>
</html>`);
});

// API: Generera via manifest-URL
app.post('/generate', async (req, res) => {
  const { manifestUrl, packageId } = req.body;
  if (!manifestUrl || !packageId) {
    return res.status(400).json({ error: 'Missing manifestUrl or packageId' });
  }
  const outputDir = path.join(__dirname, 'output-' + Date.now());
  try {
    const { apkPath, aabPath } = await generateApkAab(manifestUrl, packageId, outputDir);
    res.json({ apkPath, aabPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Ladda upp ZIP med webapp
app.post('/upload', upload.single('webapp'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil uppladdad' });

  // Extrahera zip
  const tempDir = path.join(__dirname, 'webapp-' + Date.now());
  fs.mkdirSync(tempDir);
  const zip = new AdmZip(req.file.path);
  zip.extractAllTo(tempDir, true);

  // Leta upp manifest.json
  function findManifest(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isFile() && file.name === "manifest.json") return fullPath;
      if (file.isDirectory()) {
        const res = findManifest(fullPath);
        if (res) return res;
      }
    }
    return null;
  }
  const manifestPath = findManifest(tempDir);
  if (!manifestPath) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'manifest.json hittades inte i uppladdad zip' });
  }

  // Skapa packageId automatiskt eller ta från frontend
  const packageId = req.body.packageId || 'com.example.pwa';

  try {
    const { apkPath, aabPath } = await generateApkAab(manifestPath, packageId, path.join(__dirname, 'output-' + Date.now()));
    res.json({ apkPath, aabPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    // Rensa temporära filer
    fs.unlinkSync(req.file.path);
    // Tips: du kan även ta bort tempDir här om du vill städa direkt
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));