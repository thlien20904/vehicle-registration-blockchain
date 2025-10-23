'use strict';
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (identity) {
      console.log('Admin identity đã tồn tại trong wallet.');
      return;
    }

    // Full path MSP Admin
    const mspPath = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp';
    const certPath = path.join(mspPath, 'signcerts/cert.pem');
    const keyDir = path.join(mspPath, 'keystore');
    const keyFiles = fs.readdirSync(keyDir);
    if (keyFiles.length === 0) throw new Error('Keystore rỗng – restart network!');
    const keyPath = path.join(keyDir, keyFiles[0]);  // 7795c84b..._sk

    // Đọc full PEM
    let cert = fs.readFileSync(certPath, 'utf8').replace(/\r\n/g, '\n');
    const key = fs.readFileSync(keyPath, 'utf8').replace(/\r\n/g, '\n');

    // Append Org1 CA cert to client cert for full chain (fix TLS client auth)
    const caPath = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem';
    const caCert = fs.readFileSync(caPath, 'utf8').replace(/\r\n/g, '\n');
    cert += '\n' + caCert;  // Append CA after client cert (multi-cert PEM)

    // Check PEM
    if (!cert.includes('-----BEGIN CERTIFICATE-----') || !cert.includes('-----END CERTIFICATE-----')) {
      throw new Error('Cert chain không PEM chuẩn!');
    }
    if (!key.includes('-----BEGIN PRIVATE KEY-----') || !key.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Key không PEM chuẩn!');
    }

    // Tạo identity object nested credentials
    const adminIdentity = {
      type: 'X.509',
      mspId: 'Org1MSP',
      credentials: {
        certificate: cert,  // Full chain
        privateKey: key,
      },
    };

    await wallet.put('admin', adminIdentity);

    console.log('✅ Admin identity imported vào wallet từ MSP cũ (with CA chain)!');
    console.log(`Key file used: ${keyFiles[0]}`);
    console.log(`Cert chain preview: ${cert.substring(0, 50)}...`);
    console.log(`Cert chain length: ${cert.length} chars (full PEM + CA)`);
    console.log(`Key length: ${key.length} chars (full PEM)`);
  } catch (error) {
    console.error('❌ Lỗi enroll Admin:', error.message);
  }
}

main();