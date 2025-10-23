'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');

const app = express();
app.use(bodyParser.json());

const ccpPath = path.resolve(__dirname, 'connection-org1.json');

// Load base CCP
let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Embed CA certs as full PEM string (no trim)
const peerCaPath = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt';
const ordererCaPath = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem';

const peerCaPem = fs.readFileSync(peerCaPath, 'utf8').replace(/\r\n/g, '\n');  // Normalize line, no trim
const ordererCaPem = fs.readFileSync(ordererCaPath, 'utf8').replace(/\r\n/g, '\n');  // Normalize line, no trim

// Check PEM format
if (!peerCaPem.includes('-----BEGIN CERTIFICATE-----') || !peerCaPem.includes('-----END CERTIFICATE-----')) {
  throw new Error('Peer CA cert không PEM chuẩn!');
}
if (!ordererCaPem.includes('-----BEGIN CERTIFICATE-----') || !ordererCaPem.includes('-----END CERTIFICATE-----')) {
  throw new Error('Orderer CA cert không PEM chuẩn!');
}

console.log('Peer CA length: ', peerCaPem.length);  // ~805 full
console.log('Peer CA preview: ', peerCaPem.substring(0, 50) + '...');
console.log('Orderer CA length: ', ordererCaPem.length);  // ~768 full
console.log('Orderer CA preview: ', ordererCaPem.substring(0, 50) + '...');

// Embed into CCP trustedRoots 'pem' (full string)
ccp.peers['peer0.org1.example.com'].tlsOptions.trustedRoots.pem = peerCaPem;
ccp.orderers['orderer.example.com'].tlsOptions.trustedRoots.pem = ordererCaPem;
console.log('✅ CCP loaded with embedded full CA PEMs!');

const walletPath = path.join(process.cwd(), 'wallet');
let gateway = null;
let network = null;
let contract = null;

// Connect Gateway (reuse)
async function connectGateway() {
  if (gateway) return;
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const identity = await wallet.get('admin');
  if (!identity) throw new Error('Admin identity not found in wallet. Run enrollAdmin.js first.');
  console.log('Identity loaded: mspId =', identity.mspId);
  console.log('Cert preview from wallet: ', identity.credentials.certificate.substring(0, 50) + '...');
  console.log('Cert length from wallet: ', identity.credentials.certificate.length);
  console.log('Key preview from wallet: ', identity.credentials.privateKey.substring(0, 50) + '...');
  console.log('Key length from wallet: ', identity.credentials.privateKey.length);

  try {
    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true }
    });
    network = await gateway.getNetwork('mychannel');
    contract = network.getContract('vehicle');
    console.log('✅ SDK connected!');
  } catch (error) {
    console.error('Connect error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Check status
async function checkFabricStatus() {
  try {
    await connectGateway();
    const result = await contract.evaluateTransaction('getAllVehicles');
    const vehicles = JSON.parse(result.toString());
    console.log(`✅ SDK healthy: ${vehicles.length} vehicles.`);
    return true;
  } catch (error) {
    console.error('❌ SDK check failed:', error.message);
    return false;
  }
}

// Health
app.get('/health', async (req, res) => {
  const ready = await checkFabricStatus();
  res.json({ status: ready ? 'OK' : 'DOWN', timestamp: new Date().toISOString() });
});

// Vehicles
app.get('/vehicles', async (req, res) => {
  try {
    await connectGateway();
    const result = await contract.evaluateTransaction('getAllVehicles');
    const vehicles = JSON.parse(result.toString());
    res.json(vehicles);
  } catch (error) {
    console.error('❌ Query error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post('/register', async (req, res) => {
  try {
    const { id, make, model, licensePlate, owner } = req.body;
    if (!id || !make || !model || !licensePlate || !owner) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await connectGateway();
    await contract.submitTransaction('registerVehicle', licensePlate, make, model, licensePlate, owner);
    res.json({
      success: true,
      message: 'Xe đăng ký thành công!',
      data: { id, make, model, licensePlate, owner }
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Backend SDK server: http://localhost:${PORT}`);
  await checkFabricStatus();  // Initial check
});