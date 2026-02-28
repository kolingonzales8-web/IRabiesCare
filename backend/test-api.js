const BASE_URL = 'http://localhost:3001/api';

let token = '';
let userId = '';

async function makeRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json;
}

async function test() {
  try {
    console.log('\n===== Testing Case API Flow =====\n');

    // Step 1: Login
    console.log('1️⃣ Logging in as admin...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123456'
    });
    token = loginRes.token;
    userId = loginRes.user._id;
    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   User: ${loginRes.user.name}\n`);

    // Step 2: Get existing cases
    console.log('2️⃣ Fetching existing cases...');
    const getCasesRes = await makeRequest('GET', '/cases');
    console.log(`✅ Found ${getCasesRes.cases.length} cases`);
    console.log(`   Cases: ${getCasesRes.cases.map(c => c.caseId).join(', ')}\n`);

    // Step 3: Create a new case (simulating mobile app)
    console.log('3️⃣ Creating a new case (simulating mobile app)...');
    const newCasePayload = {
      fullName: 'Test Patient from Mobile',
      age: 30,
      sex: 'Male',
      address: '123 Test Street, Test City',
      contact: '09123456789',
      email: 'test@example.com',
      exposureType: 'Bite',
      bodyPartAffected: 'Hand',
      dateOfExposure: new Date('2025-02-18').toISOString(),
      timeOfExposure: '15:30',
      location: 'Test Park',
      animalInvolved: 'Dog',
      animalStatus: 'Stray',
      animalVaccinated: 'Unknown',
      woundBleeding: 'Yes',
      woundWashed: 'Yes',
      numberOfWounds: 2,
    };
    
    const createCaseRes = await makeRequest('POST', '/cases', newCasePayload);
    console.log(`✅ Case created successfully!`);
    console.log(`   Case ID: ${createCaseRes.case.caseId}`);
    console.log(`   Created By: ${createCaseRes.case.createdBy}\n`);

    // Step 4: Fetch cases again to verify
    console.log('4️⃣ Fetching cases again to verify...');
    const getCasesAfterRes = await makeRequest('GET', '/cases');
    console.log(`✅ Found ${getCasesAfterRes.cases.length} cases now`);
    const newCases = getCasesAfterRes.cases.filter(c => c.fullName === 'Test Patient from Mobile');
    if (newCases.length > 0) {
      console.log(`✅ NEW CASE FOUND IN RESULTS!`);
      console.log(`   ${newCases[0].fullName} - ${newCases[0].caseId}`);
    } else {
      console.log(`❌ NEW CASE NOT FOUND IN RESULTS!`);
    }
    console.log(`   Total cases: ${getCasesAfterRes.cases.map(c => c.caseId).join(', ')}\n`);

    // Step 5: Get case stats
    console.log('5️⃣ Fetching case stats...');
    const statsRes = await makeRequest('GET', '/cases/stats');
    console.log(`✅ Stats:`);
    console.log(`   Total: ${statsRes.total}`);
    console.log(`   Ongoing: ${statsRes.ongoing}`);
    console.log(`   Completed: ${statsRes.completed}`);
    console.log(`   Pending: ${statsRes.pending}\n`);

    console.log('===== Test Complete =====\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
