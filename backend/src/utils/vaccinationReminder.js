const cron                 = require('node-cron');
const Vaccination          = require('../models/vaccination.model');
const Patient              = require('../models/patient.model');
const Case                 = require('../models/case.model');
const User                 = require('../models/user.model');
const sendPushNotification = require('./sendPushNotification');

const DOSE_SCHEDULE = [
  { day: 'day0',  label: 'Day 0 (First Dose)',  scheduledField: 'day0Scheduled',  missedField: 'day0Missed',  givenField: 'day0'  },
  { day: 'day3',  label: 'Day 3',               scheduledField: 'day3Scheduled',  missedField: 'day3Missed',  givenField: 'day3'  },
  { day: 'day7',  label: 'Day 7',               scheduledField: 'day7Scheduled',  missedField: 'day7Missed',  givenField: 'day7'  },
  { day: 'day14', label: 'Day 14',              scheduledField: 'day14Scheduled', missedField: 'day14Missed', givenField: 'day14' },
  { day: 'day28', label: 'Day 28 (Final Dose)', scheduledField: 'day28Scheduled', missedField: 'day28Missed', givenField: 'day28' },
];

/**
 * Runs every day at 8:00 AM Philippine time.
 * Chain: Vaccination → Patient → Case → patientUserId → User → pushToken
 */
const startVaccinationReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminder Job] Checking PEP doses due today...');

    try {
      const today      = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0,  0,  0);
      const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const vaccinations = await Vaccination.find({ status: 'Ongoing' });

      if (vaccinations.length === 0) {
        console.log('[Reminder Job] No ongoing vaccinations.');
        return;
      }

      let notifCount = 0;

      for (const vaccination of vaccinations) {
        for (const dose of DOSE_SCHEDULE) {
          const scheduledDate = vaccination[dose.scheduledField];
          const alreadyGiven  = vaccination[dose.givenField];
          const isMissed      = vaccination[dose.missedField];

          if (!scheduledDate || alreadyGiven || isMissed) continue;

          const doseDate = new Date(scheduledDate);
          if (doseDate < startOfDay || doseDate > endOfDay) continue;

          // Follow the chain: Vaccination → Patient → Case → User
          const patient = await Patient.findById(vaccination.patientId);
          if (!patient) continue;

          const caseRecord = await Case.findById(patient.caseId);
          if (!caseRecord?.patientUserId) continue;

          const user = await User.findById(caseRecord.patientUserId).select('pushToken name');
          if (!user?.pushToken) continue;

          await sendPushNotification(
            user.pushToken,
            'Rabies Vaccine Reminder',
            `You have a scheduled anti-rabies vaccine today — ${dose.label}. Please visit your health center.`,
            {
              type:          'vaccination_reminder',
              vaccinationId: vaccination._id.toString(),
              dose:          dose.day,
            }
          );

          console.log(`[Reminder Job] Notified ${user.name} for ${dose.label}`);
          notifCount++;
        }
      }

      console.log(`[Reminder Job] Done — ${notifCount} notification(s) sent.`);
    } catch (err) {
      console.error('[Reminder Job] Error:', err);
    }
  }, {
    timezone: 'Asia/Manila',
  });

  console.log('[Reminder Job] Vaccination reminder job scheduled (8:00 AM PHT daily).');
};

module.exports = startVaccinationReminderJob;