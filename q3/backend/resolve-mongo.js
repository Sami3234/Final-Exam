const https = require('https');
const fs = require('fs');
const path = require('path');

const fetchDns = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/dns-json' } }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

async function fixConnection() {
  console.log('Resolving MongoDB Atlas Cluster via Secure DNS-over-HTTPS (DoH)...');
  const domain = 'cluster0.yccdcit.mongodb.net';
  const srvUrl = `https://dns.google/resolve?name=_mongodb._tcp.${domain}&type=SRV`;
  const txtUrl = `https://dns.google/resolve?name=${domain}&type=TXT`;

  try {
    const srvData = await fetchDns(srvUrl);
    const txtData = await fetchDns(txtUrl);

    if (!srvData.Answer || srvData.Answer.length === 0) {
      console.error('Could not resolve SRV records from Google DNS.');
      return;
    }

    const hosts = srvData.Answer.map(ans => {
      const parts = ans.data.trim().split(/\s+/);
      const port = parts[2];
      const host = parts[3].replace(/\.$/, '');
      return `${host}:${port}`;
    }).join(',');

    let extraParams = 'ssl=true&authSource=admin&retryWrites=true&w=majority';
    if (txtData.Answer && txtData.Answer.length > 0) {
      const txtVal = txtData.Answer[0].data.replace(/"/g, '');
      extraParams = `${txtVal}&ssl=true&retryWrites=true&w=majority`;
    }

    const password = 'Sami12345';
    const directUri = `mongodb://samikhan:${password}@${hosts}/cartcraft?${extraParams}`;

    console.log('\nSuccessfully resolved direct connection string:');
    console.log(directUri);

    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/MONGO_URI=.*/, `MONGO_URI=${directUri}`);
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\nUpdated .env file with direct connection string successfully!');
    console.log('Now you can run: npm run seed');
  } catch (err) {
    console.error('DoH resolution error:', err.message);
  }
}

fixConnection();
