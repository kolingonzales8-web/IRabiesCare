import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Switch,
  Modal, FlatList, StatusBar, Image,
} from 'react-native';
import { ChevronLeft, ChevronRight, Check, User, AlertTriangle, Cat, Bandage, FileCheck, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/client';
import { BOHOL_DATA, MUNICIPALITIES } from '../../constants/bohol';
import useThemeStore from '../store/themeStore';
import { useColors } from '../theme/colors';
import useAuthStore from '../store/authStore';

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Exposure', icon: AlertTriangle },
  { label: 'Animal',   icon: Cat },
  { label: 'Wound',    icon: Bandage },
  { label: 'Consent',  icon: FileCheck },
];

const DropdownSelect = ({ label, options, value, onChange, colors }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <View style={styles.optionsRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, { borderColor: colors.border, backgroundColor: colors.input }, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, { color: colors.subText }, value === opt && styles.optionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const Field = ({ label, placeholder, value, onChange, keyboardType = 'default', editable = true, multiline = false, colors }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
        !editable && styles.inputDisabled,
        multiline && { height: 80, textAlignVertical: 'top' },
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.subText}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      editable={editable}
      multiline={multiline}
    />
  </View>
);

const YesNo = ({ label, value, onChange, colors }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <View style={styles.optionsRow}>
      {['Yes', 'No', 'Unknown'].map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, { borderColor: colors.border, backgroundColor: colors.input }, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, { color: colors.subText }, value === opt && styles.optionTextActive]}>{opt}</Text>
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

const PickerButton = ({ label, value, placeholder, onPress, disabled, colors }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    <TouchableOpacity
      style={[styles.pickerBtn, { backgroundColor: colors.input, borderColor: colors.border }, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.pickerText, { color: value ? colors.text : colors.subText }]}>{value || placeholder}</Text>
      <ChevronDown color={colors.subText} size={16} />
    </TouchableOpacity>
  </View>
);

export default function AddCaseScreen({ navigation }) {
  const { dark } = useThemeStore();
  const colors = useColors(dark);
  const { user } = useAuthStore();

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [showBarangayPicker,     setShowBarangayPicker]     = useState(false);

  // ── Date/Time picker states ──
  const [showDobPicker,      setShowDobPicker]      = useState(false);
  const [showExposurePicker, setShowExposurePicker] = useState(false);
  const [showTimePicker,     setShowTimePicker]     = useState(false);
  const [dobDate,            setDobDate]            = useState(new Date());
  const [exposureDateObj,    setExposureDateObj]    = useState(new Date());
  const [exposureTimeObj,    setExposureTimeObj]    = useState(new Date());

  // ── Personal Info ──
  const [firstName,     setFirstName]     = useState('');
  const [middleName,    setMiddleName]    = useState('');
  const [lastName,      setLastName]      = useState('');
  const [dob,           setDob]           = useState('');
  const [age,           setAge]           = useState('');
  const [sex,           setSex]           = useState('');
  const [municipality,  setMunicipality]  = useState('');
  const [barangay,      setBarangay]      = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [contact,       setContact]       = useState('');
  const [email,         setEmail]         = useState('');

  // ── Exposure Info ──
  const [exposureDate,      setExposureDate]      = useState('');
  const [exposureTime,      setExposureTime]      = useState('');
  const [placeOfIncident,   setPlaceOfIncident]   = useState('');
  const [exposureType,      setExposureType]      = useState('');
  const [bodyPart,          setBodyPart]          = useState('');

  // ── Animal Info ──
  const [animalSpecies,    setAnimalSpecies]    = useState('');
  const [animalOwnership,  setAnimalOwnership]  = useState('');
  const [animalVaccinated, setAnimalVaccinated] = useState('');

  // ── Wound Info ──
  const [isBleeding,   setIsBleeding]   = useState('');
  const [washedWound,  setWashedWound]  = useState('');
  const [numWounds,    setNumWounds]    = useState('');
  const [woundPhoto,   setWoundPhoto]   = useState(null);

  // ── Consent ──
  const [consentTreatment, setConsentTreatment] = useState(false);
  const [consentPrivacy,   setConsentPrivacy]   = useState(false);

  // ── Helpers ──
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
  const getFullName    = () => [firstName, middleName, lastName].filter(Boolean).join(' ');
  const getFinalAddress = () => {
    const base = municipality === 'Others (Outside Bohol)' ? customAddress : municipality;
    return barangay ? `${barangay}, ${base}` : base;
  };
  const barangayList = municipality && BOHOL_DATA[municipality] ? BOHOL_DATA[municipality] : [];

  // ── Date/Time picker handlers ──
  const handleDobPick = (event, selected) => {
    setShowDobPicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      setDobDate(selected);
      const mm   = String(selected.getMonth() + 1).padStart(2, '0');
      const dd   = String(selected.getDate()).padStart(2, '0');
      const yyyy = selected.getFullYear();
      handleDobChange(`${mm}/${dd}/${yyyy}`);
    }
  };

  const handleExposureDatePick = (event, selected) => {
    setShowExposurePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      setExposureDateObj(selected);
      const mm   = String(selected.getMonth() + 1).padStart(2, '0');
      const dd   = String(selected.getDate()).padStart(2, '0');
      const yyyy = selected.getFullYear();
      setExposureDate(`${mm}/${dd}/${yyyy}`);
    }
  };

  const handleExposureTimePick = (event, selected) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) {
      setExposureTimeObj(selected);
      const hh  = String(selected.getHours()).padStart(2, '0');
      const min = String(selected.getMinutes()).padStart(2, '0');
      setExposureTime(`${hh}:${min}`);
    }
  };

  // ── Image picker ──
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setWoundPhoto(result.assets[0]);
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setWoundPhoto(result.assets[0]);
  };

  // ── Validation ──
  const validateStep = () => {
  if (step === 0) {

    if (!firstName || !lastName || !dob || !sex || !municipality || !contact || !email)
    return 'Please fill in all required personal information fields.';

    if (municipality === 'Others (Outside Bohol)' && !customAddress)
      return 'Please enter your full address.';
    if (municipality !== 'Others (Outside Bohol)' && !barangay)
      return 'Please select your barangay.';

    // ✅ Contact — numbers only, exactly 11 digits
    const contactClean = contact.replace(/\s/g, '');
    if (!/^\d{11}$/.test(contactClean))
      return 'Contact number must be exactly 11 digits (numbers only).';

    // ✅ Email — required and must be valid format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  return 'Please enter a valid email address (e.g. name@email.com).';
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
  if (err) {
    Alert.alert('Incomplete', err);
    return; // ← this stops navigation
  }
  setStep(step + 1);
};

  // ── Submit ──
  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { Alert.alert('Incomplete', err); return; }
    setLoading(true);
    try {
      // ✅ Safe date parsing from MM/DD/YYYY
      const dateParts = exposureDate.split('/');
      let parsedDate;
      if (dateParts.length === 3) {
        parsedDate = new Date(
          `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
        );
      } else {
        parsedDate = new Date(exposureDate);
      }

      if (isNaN(parsedDate.getTime())) {
        Alert.alert('Invalid Date', 'Please select a valid exposure date.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('fullName',         getFullName());
      formData.append('age',              String(parseInt(age) || 0));
      formData.append('sex',              sex);
      formData.append('address',          getFinalAddress());
      formData.append('contact',          contact);
      formData.append('email',            email || '');
      formData.append('dateOfExposure',   parsedDate.toISOString());
      formData.append('timeOfExposure',   exposureTime);
      formData.append('location',         placeOfIncident);
      formData.append('exposureType',     exposureType);
      formData.append('bodyPartAffected', bodyPart);
      formData.append('animalInvolved',   animalSpecies);
      formData.append('animalStatus',     animalOwnership);
      formData.append('animalVaccinated', animalVaccinated);
      formData.append('woundBleeding',    isBleeding);
      formData.append('woundWashed',      washedWound);
      formData.append('numberOfWounds',   String(parseInt(numWounds) || 0));

      if (woundPhoto) {
        const filename = woundPhoto.uri.split('/').pop();
        const match    = /\.(\w+)$/.exec(filename);
        const type     = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('document', { uri: woundPhoto.uri, name: filename, type });
      }

      await apiClient.post('/cases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Case registered successfully!', [
        { text: 'OK', onPress: () => navigation.replace('Dashboard') },
      ]);
    } catch (err) {
      console.log('Submit error:', err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render Steps ──
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <>
          <Text style={[styles.stepHeading, { color: colors.text }]}>Personal Information</Text>
          <Field label="First Name *"             placeholder="Juan"          value={firstName}  onChange={setFirstName}  colors={colors} />
          <Field label="Middle Name (Optional)"   placeholder="Santos"        value={middleName} onChange={setMiddleName} colors={colors} />
          <Field label="Last Name *"              placeholder="Dela Cruz"     value={lastName}   onChange={setLastName}   colors={colors} />

          {/* Date of Birth — picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Date of Birth *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowDobPicker(true)}
            >
              <Text style={[styles.pickerText, { color: dob ? colors.text : colors.subText }]}>
                {dob || 'Select date of birth...'}
              </Text>
              <ChevronDown color={colors.subText} size={16} />
            </TouchableOpacity>
          </View>

          <Field label="Age (Auto-computed)" placeholder="—" value={age} onChange={setAge} editable={false} colors={colors} />
          <DropdownSelect label="Sex *" options={['Male', 'Female']} value={sex} onChange={setSex} colors={colors} />
          <PickerButton label="Municipality * (Bohol)" value={municipality} placeholder="Select municipality..." onPress={() => setShowMunicipalityPicker(true)} colors={colors} />
          {municipality === 'Others (Outside Bohol)' && (
            <Field label="Full Address *" placeholder="Enter complete address..." value={customAddress} onChange={setCustomAddress} multiline colors={colors} />
          )}
          {municipality && municipality !== 'Others (Outside Bohol)' && (
            <PickerButton label="Barangay *" value={barangay} placeholder="Select barangay..." onPress={() => setShowBarangayPicker(true)} colors={colors} />
          )}
          <Field 
            label="Contact Number *" 
            placeholder="09XX XXX XXXX" 
            value={contact} 
            onChange={(val) => {
              const numbersOnly = val.replace(/[^0-9]/g, '');
              if (numbersOnly.length <= 11) setContact(numbersOnly);
            }}
            keyboardType="number-pad"
            colors={colors} 
          />
          <Field label="Email Address *"  placeholder="email@example.com" value={email} onChange={setEmail} keyboardType="email-address" colors={colors} />
        </>
      );

      case 1: return (
        <>
          <Text style={[styles.stepHeading, { color: colors.text }]}>Exposure Information</Text>

          {/* Date of Exposure — picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Date of Exposure *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowExposurePicker(true)}
            >
              <Text style={[styles.pickerText, { color: exposureDate ? colors.text : colors.subText }]}>
                {exposureDate || 'Select exposure date...'}
              </Text>
              <ChevronDown color={colors.subText} size={16} />
            </TouchableOpacity>
          </View>

          {/* Time of Exposure — picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Time of Exposure *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.pickerText, { color: exposureTime ? colors.text : colors.subText }]}>
                {exposureTime || 'Select time of exposure...'}
              </Text>
              <ChevronDown color={colors.subText} size={16} />
            </TouchableOpacity>
          </View>

          <Field label="Place of Incident *"   placeholder="Brgy. San Jose, near market" value={placeOfIncident} onChange={setPlaceOfIncident} colors={colors} />
          <DropdownSelect label="Type of Exposure *"    options={['Bite', 'Scratch', 'Lick on Broken Skin']} value={exposureType} onChange={setExposureType} colors={colors} />
          <DropdownSelect label="Body Part Affected *"  options={['Hand', 'Leg', 'Arm', 'Face', 'Others']}   value={bodyPart}     onChange={setBodyPart}     colors={colors} />
        </>
      );

      case 2: return (
        <>
          <Text style={[styles.stepHeading, { color: colors.text }]}>Animal Information</Text>
          <DropdownSelect label="Animal Species *"       options={['Dog', 'Cat', 'Others']}          value={animalSpecies}    onChange={setAnimalSpecies}    colors={colors} />
          <DropdownSelect label="Animal Ownership *"     options={['Owned', 'Stray', 'Unknown']}     value={animalOwnership}  onChange={setAnimalOwnership}  colors={colors} />
          <YesNo          label="Is the Animal Vaccinated? *"                                         value={animalVaccinated} onChange={setAnimalVaccinated} colors={colors} />
        </>
      );

      case 3: return (
        <>
          <Text style={[styles.stepHeading, { color: colors.text }]}>Wound Information</Text>
          <YesNo label="Is the Wound Bleeding? *"  value={isBleeding}  onChange={setIsBleeding}  colors={colors} />
          <YesNo label="Did you Wash the Wound? *" value={washedWound} onChange={setWashedWound} colors={colors} />
          <Field label="Number of Wounds *" placeholder="1" value={numWounds} onChange={setNumWounds} keyboardType="numeric" colors={colors} />

          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.subText }]}>Photo of Wound (Optional)</Text>
            {woundPhoto ? (
              <View>
                <Image source={{ uri: woundPhoto.uri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.photoActions}>
                  <TouchableOpacity style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={handlePickImage}>
                    <Text style={[styles.photoBtnText, { color: colors.text }]}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoBtn, { borderColor: '#ef4444', backgroundColor: '#fef2f2' }]} onPress={() => setWoundPhoto(null)}>
                    <Text style={[styles.photoBtnText, { color: '#ef4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={handlePickImage}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                  <Text style={[styles.uploadBtnText, { color: colors.text }]}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={handleTakePhoto}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={[styles.uploadBtnText, { color: colors.text }]}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      );

      case 4: return (
        <>
          <Text style={[styles.stepHeading, { color: colors.text }]}>Consent</Text>
          <Text style={[styles.consentNote, { color: colors.subText }]}>Please read and agree to the following before submitting.</Text>
          <View style={[styles.consentCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <View style={styles.consentRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consentTitle, { color: colors.text }]}>Consent to Treatment</Text>
                <Text style={[styles.consentDesc, { color: colors.subText }]}>I consent to receive rabies post-exposure prophylaxis and related medical treatment as deemed necessary by the health professional.</Text>
              </View>
              <Switch value={consentTreatment} onValueChange={setConsentTreatment} trackColor={{ false: '#e2e8f0', true: '#1565C0' }} thumbColor={consentTreatment ? '#fff' : '#94a3b8'} />
            </View>
          </View>
          <View style={[styles.consentCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <View style={styles.consentRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consentTitle, { color: colors.text }]}>Data Privacy Consent</Text>
                <Text style={[styles.consentDesc, { color: colors.subText }]}>I agree that my personal information may be collected, stored, and processed in accordance with the Data Privacy Act of 2012 for health monitoring purposes.</Text>
              </View>
              <Switch value={consentPrivacy} onValueChange={setConsentPrivacy} trackColor={{ false: '#e2e8f0', true: '#1565C0' }} thumbColor={consentPrivacy ? '#fff' : '#94a3b8'} />
            </View>
          </View>
        </>
      );

      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.header} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 0 ? navigation.goBack() : setStep(step - 1)}>
          <ChevronLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Case</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Bar */}
      <View style={[styles.stepBarWrap, { backgroundColor: colors.header }]}>
        <View style={styles.stepBar}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepCircle, i < step && styles.stepDone, i === step && styles.stepActive, { borderColor: i < step ? colors.accent : colors.border }]}>
                {i < step ? <Check color={colors.text} size={12} /> : <s.icon color={i === step ? colors.accent : colors.subText} size={13} />}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone, { backgroundColor: i < step ? colors.accent : colors.border }]} />}
            </View>
          ))}
        </View>
        <Text style={[styles.stepLabel, { color: colors.text }]}>{`Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}</Text>
      </View>

      {/* Body */}
      <ScrollView style={[styles.body, { backgroundColor: colors.bg }]} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          {renderStep()}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {step > 0 && (
          <TouchableOpacity style={[styles.prevBtn, { borderColor: colors.border, backgroundColor: colors.input }]} onPress={() => setStep(step - 1)}>
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
          <TouchableOpacity style={[styles.nextBtn, styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Check color="#fff" size={18} /><Text style={styles.nextText}>Submit Case</Text></>}
          </TouchableOpacity>
        )}
      </View>

      {/* Location Modals */}
      <PickerModal visible={showMunicipalityPicker} title="Select Municipality" items={[...MUNICIPALITIES, 'Others (Outside Bohol)']} selected={municipality} onSelect={handleMunicipalitySelect} onClose={() => setShowMunicipalityPicker(false)} />
      <PickerModal visible={showBarangayPicker}     title="Select Barangay"    items={barangayList}                                  selected={barangay}      onSelect={setBarangay}             onClose={() => setShowBarangayPicker(false)} />

      {/* Date/Time Pickers */}
      {showDobPicker && (
        <DateTimePicker
          value={dobDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDobPick}
        />
      )}
      {showExposurePicker && (
        <DateTimePicker
          value={exposureDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleExposureDatePick}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={exposureTimeObj}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={handleExposureTimePick}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#1565C0' },
  backBtn:      { width: 40, height: 40, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, marginLeft: 16 },
  stepBarWrap:  { backgroundColor: '#1565C0', paddingHorizontal: 24, paddingBottom: 20 },
  stepBar:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepItem:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCircle:   { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  stepActive:   { backgroundColor: '#fff', borderColor: '#fff' },
  stepDone:     { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepLine:     { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#10b981' },
  stepLabel:    { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  body:         { flex: 1 },
  formContent:  { paddingHorizontal: 16, paddingTop: 18 },
  formCard:     { borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  stepHeading:  { fontSize: 16, fontWeight: '700', marginBottom: 20 },
  inputGroup:   { marginBottom: 18 },
  label:        { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },
  input:        { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, borderWidth: 1.5 },
  inputDisabled:{ opacity: 0.5 },
  optionsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn:    { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  optionBtnActive:  { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  optionText:       { fontSize: 13, fontWeight: '500' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  pickerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5 },
  pickerText:   { fontSize: 14, flex: 1 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoBtn:     { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  photoBtnText: { fontSize: 13, fontWeight: '600' },
  uploadRow:    { flexDirection: 'row', gap: 12 },
  uploadBtn:    { flex: 1, paddingVertical: 20, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  uploadIcon:   { fontSize: 28 },
  uploadBtnText:{ fontSize: 13, fontWeight: '600' },
  consentNote:  { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  consentCard:  { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1.5 },
  consentRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  consentTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  consentDesc:  { fontSize: 12, lineHeight: 19, paddingRight: 8 },
  footer:       { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 10, borderTopWidth: 1 },
  prevBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  prevText:     { color: '#1565C0', fontSize: 14, fontWeight: '600' },
  nextBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1565C0', paddingVertical: 14, borderRadius: 12, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtn:    { backgroundColor: '#10b981' },
  nextText:     { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});

const modal = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#e2e8f0', maxHeight: '80%' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title:        { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cancel:       { fontSize: 14, color: '#1565C0', fontWeight: '600' },
  search:       { marginHorizontal: 16, marginVertical: 12, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: '#1e293b', borderWidth: 1.5, borderColor: '#e2e8f0' },
  item:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  itemActive:   { backgroundColor: '#f0f4ff' },
  itemText:     { fontSize: 14, color: '#475569' },
  itemTextActive:{ fontWeight: '700', color: '#1565C0' },
  separator:    { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
});