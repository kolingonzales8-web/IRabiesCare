const cron                 = require('node-cron');
const Vaccination          = require('../models/vaccination.model');
const User                 = require('../models/user.model');
const sendPushNotification = require('./sendPushNotification');

// PEP dose day labels
const DOSE_LABELS = {
  0:  'Day 0 (First Dose)',
  3:  'Day 3',
  7:  'Day 7',
  14: 'Day 14',
  28: 'Day 28 (Final Dose)',
};

/**
 * Runs every day at 8:00 AM.
 * Finds all PEP vaccination records where a dose is scheduled for today
 * and sends a push notification to the patient.
 */
const startVaccinationReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminder Job] Checking PEP doses due today...');

    try {
      const today      = new Date();
      const startOfDay = new Date(today.setHours(0,  0,  0, 0));
      const endOfDay   = new Date(today.setHours(23, 59, 59, 999));

      // Find vaccinations with a scheduled dose today that hasn't been given yet
      const vaccinations = await Vaccination.find({
        nextDoseDate: { $gte: startOfDay, $lte: endOfDay },
        status:       { $ne: 'completed' },
      }).populate('patient');  // adjust field name to match your vaccination model

      if (vaccinations.length === 0) {
        console.log('[Reminder Job] No doses due today.');
        return;
      }

      for (const vaccination of vaccinations) {
        const patient = vaccination.patient;
        if (!patient?.pushToken) continue;

        const doseDay   = vaccination.currentDoseDay ?? '';   // e.g. 0, 3, 7, 14, 28
        const doseLabel = DOSE_LABELS[doseDay] ?? `Dose ${doseDay}`;
        const center    = vaccination.healthCenter ?? 'your health center';

        await sendPushNotification(
          patient.pushToken,
          'Rabies Vaccine Reminder',
          `You have a scheduled anti-rabies vaccine today — ${doseLabel}. Please visit ${center}.`,
          {
            type:          'vaccination_reminder',
            vaccinationId: vaccination._id.toString(),
            doseDay,
          }
        );

        console.log(`[Reminder Job] Sent reminder to ${patient.name} for ${doseLabel}`);
      }
    } catch (err) {
      console.error('[Reminder Job] Error:', err);
    }
  }, {
    timezone: 'Asia/Manila',  // Philippine Standard Time
  });

  console.log('[Reminder Job] Vaccination reminder job scheduled (8:00 AM PHT daily).');
};

module.exports = startVaccinationReminderJob;