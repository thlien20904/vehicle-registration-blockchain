'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Fabric CLI environment
process.env.PATH += ':/home/tlien/go/src/github.com/hyperledger/fabric-samples/bin';
process.env.FABRIC_CFG_PATH = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/config/';

const FABRIC_ENV = {
  CORE_PEER_LOCALMSPID: 'Org1MSP',
  CORE_PEER_TLS_ENABLED: 'true',
  CORE_PEER_ADDRESS: 'localhost:7051',
  CORE_PEER_TLS_ROOTCERT_FILE:
    '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
  CORE_PEER_MSPCONFIGPATH:
    '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp'
};

// Fabric status
let fabricReady = false;
let lastCheck = null;

// Check Fabric network
async function checkFabricStatus() {
  try {
    const { stdout: dockerOut } = await execPromise('docker ps --format "{{.Names}}"');
    const containers = dockerOut.split('\n').filter(c => c.includes('example.com') && c.trim());
    if (containers.length < 5) throw new Error('Not enough Fabric containers running.');

    const { stdout: channelOut } = await execPromise('peer channel list', {
      cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network',
      env: { ...process.env, ...FABRIC_ENV }
    });
    if (!channelOut.includes('mychannel')) throw new Error('Channel mychannel not found.');

    fabricReady = true;
    lastCheck = new Date().toISOString();
  } catch (err) {
    fabricReady = false;
    lastCheck = new Date().toISOString();
  }
}

// Middleware check Fabric
app.use(async (req, res, next) => {
  if (!fabricReady) await checkFabricStatus();
  if (!fabricReady) {
    return res.status(503).json({ error: 'Fabric network not ready', checkedAt: lastCheck });
  }
  next();
});

// Health check
app.get('/health', async (req, res) => {
  await checkFabricStatus();
  res.json({ status: fabricReady ? 'OK' : 'DOWN', fabricReady, checkedAt: lastCheck });
});

// Get all vehicles
app.get('/vehicles', async (req, res) => {
  try {
    const { stdout } = await execPromise(
      'peer chaincode query -C mychannel -n vehicle -c \'{"Args":["getAllVehicles"]}\'',
      { cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network', env: { ...process.env, ...FABRIC_ENV } }
    );
    const vehicles = JSON.parse(stdout.trim());
    res.json(vehicles);
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách xe:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get total vehicle count
app.get('/vehicles/count', async (req, res) => {
  try {
    const { stdout } = await execPromise(
      'peer chaincode query -C mychannel -n vehicle -c \'{"Args":["count"]}\'',
      { cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network', env: { ...process.env, ...FABRIC_ENV } }
    );
    const count = parseInt(stdout.trim(), 10);
    res.json({ count });
  } catch (err) {
    console.error('❌ Lỗi khi lấy tổng số xe:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle by license
app.get('/vehicles/:license', async (req, res) => {
  try {
    const { license } = req.params;
    const { stdout } = await execPromise(
      `peer chaincode query -C mychannel -n vehicle -c '{"Args":["queryByLicense","${license}"]}'`,
      { cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network', env: { ...process.env, ...FABRIC_ENV } }
    );
    if (!stdout.trim() || stdout.trim() === 'null') return res.status(404).json({ error: `Vehicle ${license} not found` });
    res.json(JSON.parse(stdout.trim()));
  } catch (err) {
    console.error('❌ Lỗi khi lấy xe theo biển số:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle history by license
app.get('/vehicles/:license/history', async (req, res) => {
  try {
    const { license } = req.params;
    const { stdout } = await execPromise(
      `peer chaincode query -C mychannel -n vehicle -c '{"Args":["getVehicleHistory","${license}"]}'`,
      { cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network', env: { ...process.env, ...FABRIC_ENV } }
    );
    const history = JSON.parse(stdout.trim() || '[]');
    res.json(history);
  } catch (err) {
    console.error('❌ Lỗi lấy lịch sử:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Register new vehicle
app.post('/register', async (req, res) => {
  try {
    const { licensePlate, make, model, color, owner } = req.body;

    // Validate required fields
    const errors = {};
    if (!licensePlate) errors.licensePlate = 'Vui lòng nhập biển số';
    else if (!/^[0-9]{2}[A-Z]-[0-9]{5}$/.test(licensePlate))
      errors.licensePlate = 'Biển số sai định dạng. Ví dụ: 29A-12345';
    if (!make) errors.make = 'Vui lòng nhập hãng xe';
    if (!model) errors.model = 'Vui lòng nhập model';
    if (!color) errors.color = 'Vui lòng nhập màu xe';
    if (!owner) errors.owner = 'Vui lòng nhập chủ xe';
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    // Invoke chaincode
    const cmd = `peer chaincode invoke -o localhost:7050 \
      --ordererTLSHostnameOverride orderer.example.com \
      --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
      -C mychannel -n vehicle \
      --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
      --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
      -c '{"Args":["registerVehicle","${licensePlate}","${make}","${model}","${color}","${owner}"]}' --waitForEvent`;

    await execPromise(cmd, { cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network', env: { ...process.env, ...FABRIC_ENV } });

    res.status(200).json({ success: true, message: 'Xe đăng ký thành công' });
  } catch (err) {
    console.error('❌ Lỗi khi đăng ký xe:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, async () => {
  await checkFabricStatus();
  console.log(`🚀 Backend CLI server running at http://localhost:${PORT}`);
});
