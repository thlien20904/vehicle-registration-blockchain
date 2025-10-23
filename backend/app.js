'use strict';

// ⚙️ Cấu hình môi trường Fabric CLI
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();

// ✅ Cho phép gọi API từ frontend (localhost:3000)
app.use(cors());
app.use(bodyParser.json());

// 🧩 Cấu hình đường dẫn môi trường CLI
process.env.PATH = process.env.PATH + ':/home/tlien/go/src/github.com/hyperledger/fabric-samples/bin';
process.env.FABRIC_CFG_PATH = '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/config/';

// 🧩 Cấu hình môi trường cho Org1
const FABRIC_ENV = {
  CORE_PEER_LOCALMSPID: 'Org1MSP',
  CORE_PEER_TLS_ENABLED: 'true',
  CORE_PEER_ADDRESS: 'localhost:7051',
  CORE_PEER_TLS_ROOTCERT_FILE:
    '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt',
  CORE_PEER_MSPCONFIGPATH:
    '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp'
};

// Trạng thái Fabric
let fabricReady = false;
let lastCheck = null;

// 🔍 Hàm kiểm tra Fabric network
async function checkFabricStatus() {
  try {
    console.log('🔄 Checking Fabric network status...');

    const { stdout: dockerOut } = await execPromise('docker ps --format "{{.Names}}"');
    const containers = dockerOut.split('\n').filter(c => c.includes('example.com') && c.trim() !== '');

    if (containers.length < 5) throw new Error('Not enough Fabric containers are running.');

    const { stdout: channelOut } = await execPromise('peer channel list', {
      cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network',
      env: { ...process.env, ...FABRIC_ENV }
    });

    if (!channelOut.includes('mychannel')) throw new Error('Channel mychannel not found.');

    console.log('✅ Fabric network is healthy.');
    fabricReady = true;
    lastCheck = new Date().toISOString();
  } catch (error) {
    console.error('❌ Fabric check failed:', error.message);
    fabricReady = false;
    lastCheck = new Date().toISOString();
  }
}

// Middleware kiểm tra Fabric trước khi xử lý API
app.use(async (req, res, next) => {
  if (!fabricReady) await checkFabricStatus();
  if (!fabricReady) {
    return res.status(503).json({
      error: 'Fabric network not ready. Please start test-network.',
      checkedAt: lastCheck
    });
  }
  next();
});

// ✅ Health check
app.get('/health', async (req, res) => {
  await checkFabricStatus();
  res.json({
    status: fabricReady ? 'OK' : 'DOWN',
    fabricReady,
    checkedAt: lastCheck,
    timestamp: new Date().toISOString()
  });
});

// 🚗 Lấy danh sách tất cả xe
app.get('/vehicles', async (req, res) => {
  try {
    console.log('🔍 Querying vehicles via CLI...');
    const { stdout } = await execPromise(
      'peer chaincode query -C mychannel -n vehicle -c \'{"Args":["getAllVehicles"]}\'',
      {
        cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network',
        env: { ...process.env, ...FABRIC_ENV }
      }
    );

    const trimmed = stdout.trim();
    if (!trimmed.startsWith('[')) throw new Error(`Unexpected output: ${trimmed}`);

    const vehicles = JSON.parse(trimmed);
    console.log(`✅ Found ${vehicles.length} vehicles.`);
    res.json(vehicles);
  } catch (error) {
    console.error('❌ Query error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ➕ Đăng ký xe mới
// ➕ Đăng ký xe mới
app.post('/register', async (req, res) => {
  try {
    console.log('🔔 /register called - body:', req.body);

    const { id, make, model, licensePlate, owner } = req.body;
    // Cho phép dùng licensePlate làm id nếu id không có
    const vehicleId = id || licensePlate;

    if (!vehicleId || !make || !model || !licensePlate || !owner) {
      console.log('❌ Validation failed. Received:', { id, licensePlate, make, model, owner });
      return res.status(400).json({ error: 'Missing required fields', received: req.body });
    }

    console.log('🚗 Registering new vehicle:', { vehicleId, make, model, licensePlate, owner });

    const cmd = `peer chaincode invoke -o localhost:7050 \
      --ordererTLSHostnameOverride orderer.example.com \
      --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
      -C mychannel -n vehicle \
      --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
      --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
      -c '{"Args":["registerVehicle","${vehicleId}","${make}","${model}","${licensePlate}","${owner}"]}' --waitForEvent`;

    const { stdout, stderr } = await execPromise(cmd, {
      cwd: '/home/tlien/projects/vehicle-registration-blockchain/fabric-network/test-network',
      env: { ...process.env, ...FABRIC_ENV }
    });

    console.log('✅ CLI invoke stdout:', stdout);
    if (stderr) console.error('⚠️ CLI stderr:', stderr);

    // Trích payload nếu có
    let payload = null;
    const match = stdout && stdout.match(/payload:"(.*?)"/);
    if (match) {
      try { payload = JSON.parse(match[1]); } catch (e) { /* ignore */ }
    }

    res.status(200).json({
      success: true,
      message: 'Xe đăng ký thành công!',
      payload,
      output: stdout
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});


// 🚀 Khởi chạy server
const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Backend CLI server: http://localhost:${PORT}`);
  console.log(`📋 Health:   GET http://localhost:${PORT}/health`);
  console.log(`🚗 Vehicles: GET http://localhost:${PORT}/vehicles`);
  console.log(`➕ Register: POST http://localhost:${PORT}/register`);
  await checkFabricStatus();
});
