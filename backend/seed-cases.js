const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Case = require('./src/models/case.model');

const seedCases = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Get the admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.error('Admin user not found. Please run seed.js first.');
      process.exit(1);
    }

    // Delete existing cases
    await Case.deleteMany({ createdBy: admin.id });
    console.log('Cleared existing cases');

    // Create test cases
    const testCases = [
      {
        caseId: 'CASE001',
        fullName: 'John Doe',
        age: 28,
        sex: 'Male',
        address: '123 Main St, City',
        contact: '5551234567',
        email: 'john@example.com',
        exposureType: 'Bite',
        bodyPartAffected: 'Hand',
        dateOfExposure: new Date('2025-01-10'),
        timeOfExposure: '14:30',
        location: 'Park',
        animalInvolved: 'Dog',
        animalStatus: 'Stray',
        animalVaccinated: 'Unknown',
        woundBleeding: 'Yes',
        woundWashed: 'Yes',
        numberOfWounds: 2,
        status: 'Ongoing',
        createdBy: admin.id ,
      },
      {
        caseId: 'CASE002',
        fullName: 'Jane Smith',
        age: 35,
        sex: 'Female',
        address: '456 Oak Ave, City',
        contact: '5559876543',
        email: 'jane@example.com',
        exposureType: 'Scratch',
        bodyPartAffected: 'Arm',
        dateOfExposure: new Date('2025-01-15'),
        timeOfExposure: '10:15',
        location: 'Home',
        animalInvolved: 'Cat',
        animalStatus: 'Owned',
        animalVaccinated: 'Yes',
        woundBleeding: 'No',
        woundWashed: 'Yes',
        numberOfWounds: 3,
        status: 'Completed',
        createdBy: admin.id ,
      },
      {
        caseId: 'CASE003',
        fullName: 'Mike Johnson',
        age: 42,
        sex: 'Male',
        address: '789 Pine Rd, City',
        contact: '5554567890',
        email: 'mike@example.com',
        exposureType: 'Bite',
        bodyPartAffected: 'Leg',
        dateOfExposure: new Date('2025-02-05'),
        timeOfExposure: '16:45',
        location: 'Street',
        animalInvolved: 'Dog',
        animalStatus: 'Unknown',
        animalVaccinated: 'Unknown',
        woundBleeding: 'Yes',
        woundWashed: 'No',
        numberOfWounds: 1,
        status: 'Pending',
        createdBy: admin.id ,
      },
      {
        caseId: 'CASE004',
        fullName: 'Sarah Williams',
        age: 31,
        sex: 'Female',
        address: '321 Elm St, City',
        contact: '5552345678',
        email: 'sarah@example.com',
        exposureType: 'Lick on Broken Skin',
        bodyPartAffected: 'Hand',
        dateOfExposure: new Date('2025-02-10'),
        timeOfExposure: '09:00',
        location: 'Work',
        animalInvolved: 'Cat',
        animalStatus: 'Owned',
        animalVaccinated: 'Yes',
        woundBleeding: 'No',
        woundWashed: 'Yes',
        numberOfWounds: 1,
        status: 'Urgent',
        createdBy: admin.id ,
      },
      {
        caseId: 'CASE005',
        fullName: 'Robert Brown',
        age: 55,
        sex: 'Male',
        address: '654 Birch Ln, City',
        contact: '5558901234',
        email: 'robert@example.com',
        exposureType: 'Bite',
        bodyPartAffected: 'Leg',
        dateOfExposure: new Date('2025-02-12'),
        timeOfExposure: '13:30',
        location: 'Neighborhood',
        animalInvolved: 'Dog',
        animalStatus: 'Stray',
        animalVaccinated: 'No',
        woundBleeding: 'Yes',
        woundWashed: 'Yes',
        numberOfWounds: 4,
        status: 'Ongoing',
        createdBy: admin.id ,
      },
      {
        caseId: 'CASE006',
        fullName: 'Emily Davis',
        age: 26,
        sex: 'Female',
        address: '987 Cedar Ct, City',
        contact: '5553456789',
        email: 'emily@example.com',
        exposureType: 'Scratch',
        bodyPartAffected: 'Face',
        dateOfExposure: new Date('2025-02-14'),
        timeOfExposure: '11:20',
        location: 'Zoo',
        animalInvolved: 'Others',
        animalStatus: 'Unknown',
        animalVaccinated: 'Unknown',
        woundBleeding: 'No',
        woundWashed: 'Yes',
        numberOfWounds: 2,
        status: 'Completed',
        createdBy: admin.id ,
      },
    ];

    await Case.insertMany(testCases);
    console.log(`✅ ${testCases.length} test cases created successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedCases();
