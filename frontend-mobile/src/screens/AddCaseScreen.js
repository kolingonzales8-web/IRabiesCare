import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Switch,
  Modal, FlatList, StatusBar,
} from 'react-native';
import { ChevronLeft, ChevronRight, Check, User, AlertTriangle, Cat, Bandage, FileCheck, ChevronDown } from 'lucide-react-native';
import apiClient from '../api/client';
import { BOHOL_DATA, MUNICIPALITIES } from '../../constants/bohol';

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Exposure', icon: AlertTriangle },
  { label: 'Animal', icon: Cat },
  { label: 'Wound', icon: Bandage },
  { label: 'Consent', icon: FileCheck },
];

const DropdownSelect = ({ label, options, value, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionsRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const Field = ({ label, placeholder, value, onChange, keyboardType = 'default', editable = true, multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, !editable && styles.inputDisabled, multiline && { height: 80, textAlignVertical: 'top' }]}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      editable={editable}
      multiline={multiline}
    />
  </View>
);

const YesNo = ({ label, value, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionsRow}>
      {['Yes', 'No', 'Unknown'].map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const PickerModal = ({ visible, title, items, selected, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = items.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <Text style={modal.title}>{title}</Text>
            <TouchableOpacity onPress={() => { onClose(); setSearch(''); }}>
              <Text style={modal.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={modal.search}
            placeholder="Search..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[modal.item, selected === item && modal.itemActive]}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              >
                <Text style={[modal.itemText, selected === item && modal.itemTextActive]}>{item}</Text>
                {selected === item && <Check color="#1565C0" size={16} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={modal.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const PickerButton = ({ label, value, placeholder, onPress, disabled }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[styles.pickerBtn, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.pickerText, !value && { color: '#94a3b8' }]}>{value || placeholder}</Text>
      <ChevronDown color="#94a3b8" size={16} />
    </TouchableOpacity>
  </View>
);

export default function AddCaseScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState(false);

  const [firstName, setFirstName]     = useState('');
  const [middleName, setMiddleName]   = useState('');
  const [lastName, setLastName]       = useState('');
  const [dob, setDob]                 = useState('');
  const [age, setAge]                 = useState('');
  const [sex, setSex]                 = useState('');
  const [municipality, setMunicipality] = useState('');
  const [barangay, setBarangay]         = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [contact, setContact]         = useState('');
  const [email, setEmail]             = useState('');

  const [exposureDate, setExposureDate]       = useState('');
  const [exposureTime, setExposureTime]       = useState('');
  const [placeOfIncident, setPlaceOfIncident] = useState('');
  const [exposureType, setExposureType]       = useState('');
  const [bodyPart, setBodyPart]               = useState('');

  const [animalSpecies, setAnimalSpecies]       = useState('');
  const [animalOwnership, setAnimalOwnership]   = useState('');
  const [animalVaccinated, setAnimalVaccinated] = useState('');

  const [isBleeding, setIsBleeding]   = useState('');
  const [washedWound, setWashedWound] = useState('');
  const [numWounds, setNumWounds]     = useState('');

  const [consentTreatment, setConsentTreatment] = useState(false);
  const [consentPrivacy, setConsentPrivacy]     = useState(false);

  const computeAge = (dobStr) => {
    if (!dobStr || dobStr.length < 10) return '';
    const parts = dobStr.split('/');
    if (parts.length !== 3) return '';
    const birth = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
    if (isNaN(birth)) return '';
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a >= 0 ? String(a) : '';
  };

  const handleDobChange = (val) => { setDob(val); setAge(computeAge(val)); };
  const handleMunicipalitySelect = (muni) => { setMunicipality(muni); setBarangay(''); };
  const getFullName = () => [firstName, middleName, lastName].filter(Boolean).join(' ');
  const getFinalAddress = () => {
    const base = municipality === 'Others (Outside Bohol)' ? customAddress : municipality;
    return barangay ? `${barangay}, ${base}` : base;
  };
  const barangayList = municipality && BOHOL_DATA[municipality] ? BOHOL_DATA[municipality] : [];

  const validateStep = () => {
    if (step === 0) {
      if (!firstName || !lastName || !dob || !sex || !municipality || !contact)
        return 'Please fill in all required personal information fields.';
      if (municipality === 'Others (Outside Bohol)' && !customAddress)
        return 'Please enter your full address.';
      if (municipality !== 'Others (Outside Bohol)' && !barangay)
        return 'Please select your barangay.';
    }
    if (step === 1 && (!exposureDate || !exposureTime || !placeOfIncident || !exposureType || !bodyPart))
      return 'Please fill in all exposure information fields.';
    if (step === 2 && (!animalSpecies || !animalOwnership || !animalVaccinated))
      return 'Please fill in all animal information fields.';
    if (step === 3 && (!isBleeding || !washedWound || !numWounds))
      return 'Please fill in all wound information fields.';
    if (step === 4 && (!consentTreatment || !consentPrivacy))
      return 'You must agree to both consents to submit.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { Alert.alert('Incomplete', err); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { Alert.alert('Incomplete', err); return; }
    setLoading(true);
    try {
      const dateParts = exposureDate.split('/');
      const parsedDate = dateParts.length === 3
        ? new Date(`${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`)
        : new Date(exposureDate);
      await apiClient.post('/cases', {
        firstName, middleName: middleName || null, lastName,
        fullName: getFullName(), age: parseInt(age) || 0, sex,
        address: getFinalAddress(), contact, email: email || null,
        dateOfExposure: parsedDate, timeOfExposure: exposureTime,
        location: placeOfIncident, exposureType, bodyPartAffected: bodyPart,
        animalInvolved: animalSpecies, animalStatus: animalOwnership, animalVaccinated,
        woundBleeding: isBleeding, woundWashed: washedWound, numberOfWounds: parseInt(numWounds) || 0,
      });
      Alert.alert('Success', 'Case registered successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Dashboard') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Text style={styles.stepHeading}>Personal Information</Text>
          <Field label="First Name *" placeholder="Juan" value={firstName} onChange={setFirstName} />
          <Field label="Middle Name (Optional)" placeholder="Santos" value={middleName} onChange={setMiddleName} />
          <Field label="Last Name *" placeholder="Dela Cruz" value={lastName} onChange={setLastName} />
          <Field label="Date of Birth * (MM/DD/YYYY)" placeholder="01/15/1990" value={dob} onChange={handleDobChange} />
          <Field label="Age (Auto-computed)" placeholder="—" value={age} onChange={setAge} editable={false} />
          <DropdownSelect label="Sex *" options={['Male', 'Female']} value={sex} onChange={setSex} />
          <PickerButton label="Municipality * (Bohol)" value={municipality} placeholder="Select municipality..." onPress={() => setShowMunicipalityPicker(true)} />
          {municipality === 'Others (Outside Bohol)' && (
            <Field label="Full Address *" placeholder="Enter complete address..." value={customAddress} onChange={setCustomAddress} multiline />
          )}
          {municipality && municipality !== 'Others (Outside Bohol)' && (
            <PickerButton label="Barangay *" value={barangay} placeholder="Select barangay..." onPress={() => setShowBarangayPicker(true)} />
          )}
          <Field label="Contact Number *" placeholder="09XX XXX XXXX" value={contact} onChange={setContact} keyboardType="phone-pad" />
          <Field label="Email Address (Optional)" placeholder="email@example.com" value={email} onChange={setEmail} keyboardType="email-address" />
        </>
      );
      case 1: return (
        <>
          <Text style={styles.stepHeading}>Exposure Information</Text>
          <Field label="Date of Exposure * (MM/DD/YYYY)" placeholder="01/15/2025" value={exposureDate} onChange={setExposureDate} />
          <Field label="Time of Exposure * (HH:MM)" placeholder="14:30" value={exposureTime} onChange={setExposureTime} />
          <Field label="Place of Incident *" placeholder="Brgy. San Jose, near market" value={placeOfIncident} onChange={setPlaceOfIncident} />
          <DropdownSelect label="Type of Exposure *" options={['Bite', 'Scratch', 'Lick on Broken Skin']} value={exposureType} onChange={setExposureType} />
          <DropdownSelect label="Body Part Affected *" options={['Hand', 'Leg', 'Arm', 'Face', 'Others']} value={bodyPart} onChange={setBodyPart} />
        </>
      );
      case 2: return (
        <>
          <Text style={styles.stepHeading}>Animal Information</Text>
          <DropdownSelect label="Animal Species *" options={['Dog', 'Cat', 'Others']} value={animalSpecies} onChange={setAnimalSpecies} />
          <DropdownSelect label="Animal Ownership *" options={['Owned', 'Stray', 'Unknown']} value={animalOwnership} onChange={setAnimalOwnership} />
          <YesNo label="Is the Animal Vaccinated? *" value={animalVaccinated} onChange={setAnimalVaccinated} />
        </>
      );
      case 3: return (
        <>
          <Text style={styles.stepHeading}>Wound Information</Text>
          <YesNo label="Is the Wound Bleeding? *" value={isBleeding} onChange={setIsBleeding} />
          <YesNo label="Did you Wash the Wound? *" value={washedWound} onChange={setWashedWound} />
          <Field label="Number of Wounds *" placeholder="1" value={numWounds} onChange={setNumWounds} keyboardType="numeric" />
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadText}>📎 Upload Photo of Wound</Text>
            <Text style={styles.uploadSub}>Feature coming soon</Text>
          </View>
        </>
      );
      case 4: return (
        <>
          <Text style={styles.stepHeading}>Consent</Text>
          <Text style={styles.consentNote}>Please read and agree to the following before submitting.</Text>
          <View style={styles.consentCard}>
            <View style={styles.consentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.consentTitle}>Consent to Treatment</Text>
                <Text style={styles.consentDesc}>I consent to receive rabies post-exposure prophylaxis and related medical treatment as deemed necessary by the health professional.</Text>
              </View>
              <Switch
                value={consentTreatment}
                onValueChange={setConsentTreatment}
                trackColor={{ false: '#e2e8f0', true: '#1565C0' }}
                thumbColor={consentTreatment ? '#fff' : '#94a3b8'}
              />
            </View>
          </View>
          <View style={styles.consentCard}>
            <View style={styles.consentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.consentTitle}>Data Privacy Consent</Text>
                <Text style={styles.consentDesc}>I agree that my personal information may be collected, stored, and processed in accordance with the Data Privacy Act of 2012 for health monitoring purposes.</Text>
              </View>
              <Switch
                value={consentPrivacy}
                onValueChange={setConsentPrivacy}
                trackColor={{ false: '#e2e8f0', true: '#1565C0' }}
                thumbColor={consentPrivacy ? '#fff' : '#94a3b8'}
              />
            </View>
          </View>
        </>
      );
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* Header — matches Dashboard blue header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 0 ? navigation.goBack() : setStep(step - 1)}>
          <ChevronLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Case</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step bar — inside blue header zone */}
      <View style={styles.stepBarWrap}>
        <View style={styles.stepBar}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepCircle, i < step && styles.stepDone, i === step && styles.stepActive]}>
                {i < step
                  ? <Check color="#fff" size={12} />
                  : <s.icon color={i === step ? '#1565C0' : 'rgba(255,255,255,0.5)'} size={13} />}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
            </View>
          ))}
        </View>
        <Text style={styles.stepLabel}>{`Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}</Text>
      </View>

      {/* Light body — matches Dashboard #f1f5f9 */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {renderStep()}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
            <ChevronLeft color="#1565C0" size={18} />
            <Text style={styles.prevText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
            <ChevronRight color="#fff" size={18} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Check color="#fff" size={18} /><Text style={styles.nextText}>Submit Case</Text></>}
          </TouchableOpacity>
        )}
      </View>

      <PickerModal
        visible={showMunicipalityPicker}
        title="Select Municipality"
        items={[...MUNICIPALITIES, 'Others (Outside Bohol)']}
        selected={municipality}
        onSelect={handleMunicipalitySelect}
        onClose={() => setShowMunicipalityPicker(false)}
      />
      <PickerModal
        visible={showBarangayPicker}
        title="Select Barangay"
        items={barangayList}
        selected={barangay}
        onSelect={setBarangay}
        onClose={() => setShowBarangayPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header — same blue as Dashboard
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: '#1565C0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, marginLeft: 16 },

  // Step bar — sits in blue header zone
  stepBarWrap: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: '#fff', borderColor: '#fff' },
  stepDone:   { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepLine:     { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#10b981' },
  stepLabel: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },

  // Light body
  body:        { flex: 1, backgroundColor: '#f1f5f9' },
  formContent: { paddingHorizontal: 16, paddingTop: 18 },

  // White card wrapping each step's fields — matches Dashboard cards
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  stepHeading: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 20 },

  // Inputs — light style matching Dashboard list cards
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, letterSpacing: 0.3 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  inputDisabled: { opacity: 0.5 },

  // Option buttons
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  optionBtnActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  optionText:       { fontSize: 13, color: '#64748b', fontWeight: '500' },
  optionTextActive: { color: '#fff', fontWeight: '700' },

  // Picker button
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  pickerText: { fontSize: 14, color: '#1e293b', flex: 1 },

  // Upload placeholder
  uploadPlaceholder: {
    borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed',
    borderRadius: 12, padding: 24, alignItems: 'center',
    backgroundColor: '#f8fafc', marginTop: 4,
  },
  uploadText: { fontSize: 14, color: '#64748b', marginBottom: 4, fontWeight: '600' },
  uploadSub:  { fontSize: 12, color: '#94a3b8' },

  // Consent cards
  consentNote: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  consentCard: {
    backgroundColor: '#f8fafc', borderRadius: 14,
    padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  consentRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  consentTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  consentDesc:  { fontSize: 12, color: '#64748b', lineHeight: 19, paddingRight: 8 },

  // Footer — white bar matching Dashboard feel
  footer: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  prevText: { color: '#1565C0', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1565C0', paddingVertical: 14, borderRadius: 12,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtn: { backgroundColor: '#10b981' },
  nextText:  { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: '#e2e8f0',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title:  { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cancel: { fontSize: 14, color: '#1565C0', fontWeight: '600' },
  search: {
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: '#f8fafc', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: '#1e293b',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 14,
  },
  itemActive:     { backgroundColor: '#f0f4ff' },
  itemText:       { fontSize: 14, color: '#475569' },
  itemTextActive: { fontWeight: '700', color: '#1565C0' },
  separator:      { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
});