import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { User } from '../src';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import GoogleIcon from '../assets/icons/google-svg.svg';
import AppleIcon from '../assets/icons/apple-logo-svg.svg';
import KulsahBlack from '../assets/icons/kulsah-black-svg.svg';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';
import { fontSize } from '../typography';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DotTrioLoader from '../components/DotTrioLoader';
import { authApi, setAuthToken, setUser as setAuthStoreUser } from '../src';

const COUNTRY_OPTIONS = [
  { cca2: 'GH', callingCode: '233', label: 'Ghana' },
  { cca2: 'NG', callingCode: '234', label: 'Nigeria' },
  { cca2: 'KE', callingCode: '254', label: 'Kenya' },
  { cca2: 'ZA', callingCode: '27', label: 'South Africa' },
  { cca2: 'US', callingCode: '1', label: 'United States' },
];

const extractAuthUser = (data: Record<string, any>, fallbackIdentifier: string): User => {
  const responseUser = data.user ?? data.data?.user ?? data.data;
  if (responseUser && typeof responseUser === 'object') {
    return responseUser as User;
  }

  const normalizedIdentifier = fallbackIdentifier.trim();
  const fallbackHandle = normalizedIdentifier.includes('@')
    ? normalizedIdentifier.split('@')[0]
    : normalizedIdentifier.replace(/\D/g, '') || 'user';

  return {
    id: data.id ?? data.user_id ?? Date.now(),
    name: data.name ?? fallbackHandle,
    role: data.role ?? 'fan',
    email: normalizedIdentifier.includes('@') ? normalizedIdentifier : '',
    handle: data.username ?? data.handle ?? fallbackHandle,
    ...(normalizedIdentifier.includes('@') ? {} : { phone: normalizedIdentifier }),
  };
};


const EmailPhone: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [user, setUser] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [confirmPasswordText, setConfirmPasswordText] = useState('')
  // const [dob, setDob] = useState('');
  const [focused, setFocused] = useState(false);
  const [signInPasswordFocused, setSignInPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const titleColor = theme.text;
  const bodyColor = isDark ? '#94a3b8' : theme.textSecondary;
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const glass = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.82)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)';
  const iconBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)';
  const footerMuted = isDark ? '#64748b' : theme.textMuted;
  const labelRaised = focused || identifier.length > 0;
  const normalizedIdentifier = identifier.trim();
  const emailCandidate = normalizedIdentifier.toLowerCase();
  const phoneDigits = normalizedIdentifier.replace(/\D/g, '');
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);
  const isPhone = phoneDigits.length >= 7;
  const route = useRoute<any>();
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [eventDate, setDate] = useState(new Date());
  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.35)';
  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
  const [emailTaken, setEmailTaken] = useState(false);
  const [usernameCheckState, setUsernameCheckState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameCheckMessage, setUsernameCheckMessage] = useState('');
  const [dobError, setDobError] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  // const [id, setId] = useState<Number>(0);
  const edgeSwipeStartX = useRef(0);
  const edgeSwipeHandled = useRef(false);
  


  const lightLeakOne = useMemo(
    () =>
      isDark
        ? primaryColorAlpha(0.15)
        : primaryColorAlpha(0.08),
    [isDark]
  );

  const lightLeakTwo = useMemo(
    () =>
      isDark
        ? primaryColorAlpha(0.12)
        : primaryColorAlpha(0.07),
    [isDark]
  );

  const [countryCode, setCountryCode] = useState('GH');
  const [callingCode, setCallingCode] = useState('233');
  const [Isphone, setIsPhone] = useState(false);
  const [showDate, setShowDate] = useState(false);

  const inputRef = useRef<TextInput>(null);


  const isValidPassword = (password: string): boolean => {
  const regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};

  const getAgeInYears = (birthDate: Date) => {
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years -= 1;
    }

    return years;
  };

  const isAdult = step === 2 ? getAgeInYears(eventDate) >= 18 : true;
  const normalizedUsername = username.trim();
  const isUsernameAvailable = usernameCheckState === 'available';

  const canContinue = !isCreateAccount
    ? ((isEmail || isPhone) && signInPassword.trim().length > 0)
    : (step === 0 && user.length > 0) ||
      (step === 1 && normalizedUsername.length >= 3 && isUsernameAvailable) ||
      (step === 2 && isAdult) ||
      (step === 3 && isValidPassword(password) && password === confirmPasswordText) ||
      (step === 4 && gender.length > 0) ||
      (step === 5 && isEmail);

  const onSelectCountry = (country: typeof COUNTRY_OPTIONS[number]) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode);
    setShowCountryDropdown(false);
  };

  useEffect(()=>{
    if(route.params?.isCreateAccount){
      setIsCreateAccount(route.params?.isCreateAccount);
    }
  },[]);

  useEffect(()=>{
    if(step === 2 || step === 4)inputRef.current?.blur();
    setShowGenderDropdown(false);
  }, [step])

  useEffect(() => {
    if (!isCreateAccount || step !== 1) {
      setUsernameCheckState('idle');
      setUsernameCheckMessage('');
      return;
    }

    if (normalizedUsername.length === 0) {
      setUsernameCheckState('idle');
      setUsernameCheckMessage('');
      return;
    }

    if (normalizedUsername.length < 3) {
      setUsernameCheckState('idle');
      setUsernameCheckMessage('Username must be at least 3 characters.');
      return;
    }

    let isActive = true;
    setUsernameCheckState('checking');
    setUsernameCheckMessage('Checking username availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername({ username: normalizedUsername });
        if (!isActive) return;

        const data = res.data ?? {};
        const availabilityFlag =
          data?.unique ?? data?.is_unique ?? data?.available ?? data?.isAvailable;
        const serverMessage = typeof data?.message === 'string' ? data.message.toLowerCase() : '';

        if (typeof availabilityFlag === 'boolean') {
          if (availabilityFlag) {
            setUsernameCheckState('available');
            setUsernameCheckMessage('Username is available.');
          } else {
            setUsernameCheckState('taken');
            setUsernameCheckMessage('Username is already taken.');
          }
          return;
        }

        if (
          serverMessage.includes('taken') ||
          serverMessage.includes('exist') ||
          serverMessage.includes('already')
        ) {
          setUsernameCheckState('taken');
          setUsernameCheckMessage('Username is already taken.');
          return;
        }

        setUsernameCheckState('available');
        setUsernameCheckMessage('Username is available.');
      } catch (error: any) {
        if (!isActive) return;

        const status = error?.response?.status;
        const data = error?.response?.data ?? {};
        const serverMessage = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
        const invalid =
          status === 409 ||
          status === 422 ||
          serverMessage.includes('taken') ||
          serverMessage.includes('exist') ||
          serverMessage.includes('already');

        if (invalid) {
          setUsernameCheckState('taken');
          setUsernameCheckMessage('Username is already taken.');
        } else {
          setUsernameCheckState('error');
          setUsernameCheckMessage('Could not verify username right now.');
        }
      }
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [isCreateAccount, step, normalizedUsername]);

  useEffect(() => {
    const onHardwareBackPress = () => {
      if (!isCreateAccount) {
        return false;
      }

      if (step > 0) {
        setStep((currentStep) => currentStep - 1);
        return true;
      }

      setIsCreateAccount(false);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => subscription.remove();
  }, [isCreateAccount, step]);

  const edgeSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => {
          if (Platform.OS !== 'ios' || !isCreateAccount) {
            return false;
          }

          const x = event.nativeEvent.pageX;
          const nearEdge = x <= 24 || x >= SCREEN_WIDTH - 24;
          if (nearEdge) {
            edgeSwipeStartX.current = x;
            edgeSwipeHandled.current = false;
          }

          return nearEdge;
        },
        onMoveShouldSetPanResponder: (_event, gestureState) => {
          if (Platform.OS !== 'ios' || !isCreateAccount) {
            return false;
          }

          return Math.abs(gestureState.dx) > 16 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (edgeSwipeHandled.current || Platform.OS !== 'ios' || !isCreateAccount) {
            return;
          }

          const startedNearLeftEdge = edgeSwipeStartX.current <= 24;
          const startedNearRightEdge = edgeSwipeStartX.current >= SCREEN_WIDTH - 24;
          const swipedBackward = startedNearLeftEdge && gestureState.dx > 60;
          const swipedForward = startedNearRightEdge && gestureState.dx < -60;

          if (!swipedBackward && !swipedForward) {
            return;
          }

          edgeSwipeHandled.current = true;

          if (step > 0) {
            setStep((currentStep) => currentStep - 1);
            return;
          }

          setIsCreateAccount(false);
        },
      }),
    [SCREEN_WIDTH, isCreateAccount, step]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // useEffect(() => {
  //   if (step === 3 && (focused || confirmFocused)) {
  //     console.log('it has to scroll');
  //     requestAnimationFrame(() => {
  //       scrollRef.current?.scrollToEnd({
  //         animated: true,
  //       });
  //     });
  //   }
  // }, [step, focused, confirmFocused, keyboardHeight]);

  const handleTextChange = (text: string) => {
    setAuthError('');
    if(step === 0) setUser(text);
    if(step === 1)setUsername(text);
    if(step === 5){
      if(emailTaken){
        setEmailTaken(false);
      }
      setEmail(text);
    }
    if(step === 3)setPassword(text);
    setIdentifier(text);

  // if (text.length === 0) {
  //   setIsPhone(false);
  //   return;
  // }

  // const firstChar = text.trim()[0];

  // setIsPhone(/^\d$/.test(firstChar));
};

  const handleSignInPasswordChange = (text: string) => {
    setAuthError('');
    setSignInPassword(text);
  };

  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if(Platform.OS === 'android'){
    setShowDate(false);
    // console.log('show date is false');
    }
    if (selectedDate) {
      setDate(selectedDate);
      setDobError(getAgeInYears(selectedDate) >= 18 ? '' : 'You must be 18 years or older to continue.');
    }

    inputRef.current?.blur();
  
  };

  // const handleContinue = async() => {
  //   if (!canContinue) return;
  //   // setIdentifier("");
  //   if(isCreateAccount && step < 5){
  //     console.log('step is less than five');
  //     setStep((step + 1));
  //     // setIdentifier("");
  //     return;
  //   }

  //   if (isEmail){
  //     setLoading(true);
  //     try{
  //       const res = await api.post('auth/register', {
  //       'name': user,
  //       'username': username,
  //       'email': email,
  //       'password': password
  //     });
  //     console.log('this is the response', res);
     
  //     }catch (errors){
  //       const error = errors?.res?.data?.errors

      
  //     }
  //     setLoading(false);
  //     navigation.navigate('VerifyOtp', {
  //       email: emailCandidate,
  //     });
  //     return;
  //   }

    
  // };

  const handleContinue = async () => {
  if (!canContinue) return;

  if (!isCreateAccount) {
    setLoading(true);
    setAuthError('');

    try {
      const normalizedValue = normalizedIdentifier;
      // console.log('this is the email being sent', emailCandidate);
      const payload = isEmail
        ? { email: emailCandidate, password: signInPassword }
        : { phone: `+${callingCode}${normalizedValue.replace(/\D/g, '')}`, password: signInPassword };

      const res = await authApi.login(payload);
      const responseData = res.data ?? {};
      const sessionToken =
        responseData.access_token ??
        responseData.accessToken ??
        responseData.token ??
        '';

      if (typeof sessionToken === 'string' && sessionToken.length > 0) {
        await setAuthToken(sessionToken);
      }

      setAuthStoreUser(extractAuthUser(responseData, normalizedValue));
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });

      // navigation.navigate('VerifyOtp', {
      //  email,
      // //  id: id,
      // });
    } catch (error: any) {
      const responseData = error?.response?.data ?? {};
      // console.log('this is the error', responseData);
      const message =
        responseData?.message ||
        responseData?.error ||
        'Unable to sign in with those credentials.';
        if(message === 'Account not activated. OTP has been sent to your email or phone.'){
          const sessionToken = responseData?.token;
          if (typeof sessionToken === 'string' && sessionToken.length > 0) {
            await setAuthToken(sessionToken);
          }
          navigation.navigate('VerifyOtp', {
            email: email
          })
          return;
        }
      setAuthError(message);
    } finally {
      setLoading(false);
    }

    return;
  }

  // Move to the next step during account creation
  if (isCreateAccount && step < 5) {
    // console.log('step is less than five');
    setStep(prevStep => prevStep + 1);
    return;
  }

  // Register user when all steps are completed
  if (isEmail) {
    setLoading(true);

    try {
      // const res = await api.post('auth/register', {
      //   name: user,
      //   username,
      //   email,
      //   password,
      // });
      // console.log('this is the username:', username);
      // console.log('this is the name:', user);
      // console.log('this is the email:', email);
      // console.log('this is the password:', password);
      const res = await authApi.register({
        name: user, 
        username: username, 
        email: email, 
        password: password
      });
      // console.log('Registration successful:', res.data);
      // console.log('this is the access_token:', res.data['access_token']);
      setAuthToken(res.data['access_token']);

      // Navigate only if registration succeeds
      navigation.navigate('VerifyOtp', {
        email,
        // id:id
      });

    } catch (error: any) {
      if(error.response.data["email"][0] === "The email has already been taken."){
        setEmailTaken(true);
      }
      console.log('Registration error:', error?.response?.data);

      // const errors = error?.response?.data?.errors;

      // if (errors) {
      //   console.log('Validation errors:', errors);

      //   // Example:
      //   // setFormErrors(errors);
      // } else {
      //   console.log(
      //     error?.response?.data?.message ||
      //     error?.message ||
      //     'Something went wrong'
      //   );
      // }
    } finally {
      setLoading(false);
    }

    return;
  }
};
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'ios' ? 54 : insets.top,
        },
      ]}
      edges={[]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <View style={[styles.screen, {height: SCREEN_HEIGHT}]} {...edgeSwipeResponder.panHandlers}>
        {/* <View style={[styles.blob, styles.blobTop, { backgroundColor: lightLeakOne }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: lightLeakTwo }]} /> */}

        {isCreateAccount ? (
          <View style={[styles.stepperHeader, {}]}>
            <View style={styles.stepperBody}>
              <View style={styles.stepperRow}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const isDone = index <= step;
                  return (
                    <View
                      key={`step-line-${index}`}
                      style={[
                        styles.stepperConnector,
                        { backgroundColor: isDone ? PRIMARY_COLOR : borderColor },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                style={[styles.backButton, { backgroundColor: iconBg, borderColor }]}
              >
                <MaterialIcons name="chevron-left" size={20} color={titleColor} />
              </Pressable> */}
              <Text style={[styles.headerTitle, { color: titleColor }]}>Sign In</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              justifyContent: 'flex-start',
              paddingBottom: 32 + (step === 3 ? (keyboardHeight *0.5) : 0),
              
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                // backgroundColor: theme.background,
                borderColor,
                shadowColor: isDark ? '#000000' : '#7c3aed',
                paddingLeft: isCreateAccount ? -22 : 0
              },
            ]}
          >
            {/* <View style={[styles.cardGlow, { backgroundColor: theme.background }]} /> */}

            <View style={[styles.branding, {alignItems: isCreateAccount ? 'flex-start': 'center', marginBottom: isCreateAccount ? 10: 28, }]}>
              <View style={{
                width: '100%',
                alignItems: 'center',
              }}>
                {isDark ? <KulsahWhite width={'80%'} height={80}/>: <KulsahBlack width={'80%'} height={60}/>}
              </View>
              {/* <LinearGradient
                colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandBadge}
              >
                <MaterialIcons name="bolt" size={mediumScreen ? 28 : 24} color="#ffffff" />
              </LinearGradient> */}
              {step === 0 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22 }]}>Tell us your name</Text>}
              {step === 0 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Tell us your name so fans and creators can recognize you on Kulsah.</Text>}
              {step === 1 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22 }]}>Choose a username</Text>}
              {step === 1 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Your username is how the galaxy will know you..</Text>}
              {step === 2 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22 }]}>When were you born</Text>}
              {step === 2 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Tell us your date of birth so we can personalize your journey through the Creator Galaxy..</Text>}
              {step === 3 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22, paddingRight: -22 }]}>Create a strong password</Text>}
              {step === 3 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Use at least 8 characters with a mix of letters, numbers, and symbols.</Text>}
              {step === 4 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22 }]}>Select your gender</Text>}
              {step === 4 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>This helps us personalize your Kulsah experience.</Text>}
              {step === 5 && isCreateAccount && <Text style={[styles.brandTitle, { color: theme.textSecondary, marginTop: 30, fontSize: fontSize.b1.fontSize + (mediumScreen ? 6: 2), lineHeight: fontSize.b1.lineHeight + (mediumScreen ? 6: 2), fontFamily: fontSize.b1.fontFamily, paddingLeft: -22 }]}>{Isphone ? "Enter your phone number":"Enter your email"}</Text>}
              {step === 5 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Enter your {Isphone ? 'phone number': 'email address'} to continue creating, earning, connecting, and shining.</Text>}
              {/* {step === 1 && isCreateAccount && <Text style={[styles.brandTitle, { color: titleColor, fontSize: fontSize.b1.fontSize + (mediumScreen ? 0: 0), fontFamily: 'Inter_400Regular', paddingLeft: -22 }]}>Your username is your unique name across the Creator Galaxy.</Text>} */}
              <Pressable onPress={()=>{
                Keyboard.dismiss();
                
                setIsPhone((Isphone)=> !Isphone);
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
                setEmail("")
              }}>
                {(!isCreateAccount || (step === 5))  && <Text style={[styles.brandSubtitle, { color: PRIMARY_COLOR, marginTop: 20, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }]}>
                {`Sign In with ${Isphone ? 'email' : 'phone number'} instead ?`}
              </Text>}
              </Pressable>
            </View>

            <View style={styles.formBlock}>
              {step === 3 && <Text style = {{
                fontSize: fontSize.b4.fontSize,
                fontFamily: fontSize.b4.fontFamily,
                marginBottom: -10,
                color: theme.accent,
              }}>
                Password
                </Text>}
              {step !== 4 && <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: fieldBg,
                    // backgroundColor: 'red',
                    borderColor:
                      step === 1 && isCreateAccount
                        ? usernameCheckState === 'taken'
                          ? '#dc2626'
                          : usernameCheckState === 'available'
                            ? '#16a34a'
                            : focused
                              ? primaryColorAlpha(0.45)
                              : borderColor
                        : emailTaken
                          ? 'red'
                          : focused
                            ? primaryColorAlpha(0.45)
                            : borderColor,
                  },
                ]}
              >
                {/* <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: labelRaised ? PRIMARY_COLOR : bodyColor,
                      top: labelRaised ? 12 : '65%',
                      fontFamily: labelRaised ? fontSize.b5.fontFamily : fontSize.b4.fontFamily,
                      fontSize: labelRaised ? fontSize.b5.fontSize : fontSize.b4.fontSize,
                      lineHeight: (labelRaised ? fontSize.b5.fontSize : fontSize.b4.fontSize) + 1,
                      transform: [{ translateY: labelRaised ? 0 : -10 }],
                    },
                  ]}
                >
                  Email or Phone Number
                </Text> */}
                {Isphone &&  <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '25%',
                    // backgroundColor: 'blue'
                    // borderWidth: 1,
                    // borderColor: '#ddd',
                    // borderRadius: 10,
                    // paddingHorizontal: 10,
                  }}
                >
                  <Pressable
                    onPress={() => setShowCountryDropdown(true)}
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.b2.fontSize + (mediumScreen ? 4 : 0),
                        fontFamily: fontSize.b3.fontFamily,
                        color: theme.text,
                      }}
                    >
                      {countryCode}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: fontSize.b2.fontSize + (mediumScreen ? 6: 2), 
                        fontFamily: fontSize.b3.fontFamily,
                        color: theme.textMuted
                      }}
                    >
                      {`+${callingCode}`}
                    </Text>
                  </Pressable>
                  {/* <TextInput includeFontPadding={false}
                    style={{ flex: 1, height: 50 }}
                    placeholder={`+${callingCode} Phone Number`}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  /> */}
                </View>}

                {!Isphone  && <View style={{
                  width: '15%',
                  // backgroundColor: 'blue',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(isCreateAccount && 
                  step === 1 ? <MaterialIcons name="alternate-email" size={20} color={theme.text} />: 
                  step === 5 ? <MaterialIcons name="email" size={20} color={theme.text}/>:
                  step === 3 ? <MaterialIcons name="lock" size={20} color={theme.textMuted}/>:
                  step === 2 ? <MaterialIcons name="date-range" size={20} color={theme.text}/> : 
                  step === 0  && isCreateAccount ? <MaterialIcons name="perm-identity" size={20} color={theme.text}/> : 
                  <View style={{
                  }}>
                    {/* <Text style={{
                      fontSize: fontSize.b1.fontSize,
                      fontFamily: fontSize.b1.fontFamily,
                    }}>
                      @
                    </Text> */}
                    <MaterialIcons name="email" size={20} color={theme.text} />
                  </View>
                 )}
                  </View>}

                <TextInput includeFontPadding={false}
                  ref={inputRef}
                  value={isCreateAccount ? `${step === 1 ? username : step === 5 ? email : step === 3 ? password : step === 0 ? user : eventDate.toDateString()}`:identifier}
                  onChangeText={handleTextChange}
                  showSoftInputOnFocus={(step === 2 ? false : true)}
                  // returnKeyLabel='Done'
                  onSubmitEditing={() => {
                    if(step === 3){
                      setFocused(false);
                      setConfirmFocused(true);
                      return;
                    }
                      if(canContinue){
                        if(step < 5)setStep((step + 1));
                      }
                    }}
                  onFocus={() => {
                    if(step === 2){
                      setShowDate(true);
                    }else {
                      setFocused(true);
                    }
                  }}
                  onBlur={() => setFocused(false)}
                  placeholder= {isCreateAccount ? 
                    step === 1 ? 'Enter username':
                    step === 3 ? 'Enter password':
                    step === 2 ? 'Enter date of birth':
                    step === 0 ? 'Enter your name':
                    'Enter email address'
                     : `${Isphone ? "Enter phone number" : "Enter email address"}`}
                  keyboardType={Isphone ? "phone-pad":"email-address"}
                  autoCapitalize="none"
                  selectionColor={PRIMARY_COLOR}
                  secureTextEntry={step === 3 && showPassword}
                  style={[styles.input, { color: titleColor, width: Isphone ? '75%': step === 3 ? '75%':'85%', marginLeft: Isphone ? 5: 0, 
                    // backgroundColor: 'yellow'
                  }]}
                />

                {(isCreateAccount || step === 3 ) && step !== 5 && <Pressable
                onPress = {()=>{
                  // console.log('tapped');
                  setShowPassword((showPassword) => !showPassword)
                  // console.log('the value of show password', showPassword)
                }} 
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  // backgroundColor: 'green',
                  paddingHorizontal: 10,
                }}>
                  {showPassword ? <MaterialIcons name = "visibility-off" size={20} color={theme.textMuted}/>: <MaterialIcons name = "visibility" size={20} color={theme.textMuted}/>}
                </Pressable>}

              </View>}

              {!isCreateAccount && <View style={{ gap: 8 }}>
                <Text style={{
                  fontSize: fontSize.b4.fontSize,
                  fontFamily: fontSize.b4.fontFamily,
                  marginBottom: -10,
                  color: theme.accent,
                }}>
                  Password
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: fieldBg,
                      borderColor: signInPasswordFocused ? primaryColorAlpha(0.45) : borderColor,
                    },
                  ]}
                >
                  <View style={{
                    width: '15%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <MaterialIcons name="lock" size={20} color={theme.textMuted} />
                  </View>

                  <TextInput includeFontPadding={false}
                    value={signInPassword}
                    onChangeText={handleSignInPasswordChange}
                    onFocus={() => setSignInPasswordFocused(true)}
                    onBlur={() => setSignInPasswordFocused(false)}
                    placeholder="Enter password"
                    autoCapitalize="none"
                    selectionColor={PRIMARY_COLOR}
                    secureTextEntry={!showPassword}
                    style={[styles.input, { color: titleColor, width: '75%' }]}
                  />

                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 10,
                    }}
                  >
                    {showPassword ? (
                      <MaterialIcons name="visibility-off" size={20} color={theme.textMuted} />
                    ) : (
                      <MaterialIcons name="visibility" size={20} color={theme.textMuted} />
                    )}
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              </View>}

              {step === 1 && isCreateAccount && (
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      ...fontSize.b5,
                      color:
                        usernameCheckState === 'taken'
                          ? '#dc2626'
                          : usernameCheckState === 'available'
                            ? '#16a34a'
                            : theme.textMuted,
                    }}
                  >
                    {usernameCheckMessage ||
                      (normalizedUsername.length < 3
                        ? 'Use at least 3 characters.'
                        : 'Checking username availability...')}
                  </Text>
                </View>
              )}

              {step === 2 && isCreateAccount && (
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      ...fontSize.b5,
                      color: isAdult ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {isAdult
                      ? 'Age verified: 18+'
                      : dobError || 'You must be 18 years or older to continue.'}
                  </Text>
                </View>
              )}

              {step === 4 && isCreateAccount && <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowGenderDropdown(true);
                }}
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: fieldBg,
                    borderColor,
                  },
                ]}
              >
                <View style={styles.genderIconWrap}>
                  <MaterialIcons name="wc" size={20} color={theme.text} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.genderValue,
                    {
                      color: gender ? titleColor : theme.textMuted,
                    },
                  ]}
                >
                  {gender || 'Select gender'}
                </Text>
                <View style={styles.genderChevronWrap}>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={theme.textMuted} />
                </View>
              </Pressable>}

              {step === 3 && <View style = {{
                gap : 16,
              }}>
                  <Text style = {{
                fontSize: fontSize.b4.fontSize,
                fontFamily: fontSize.b4.fontFamily,
                marginBottom: -10,
                color: theme.accent,
              }}>
                Confirm Password
                </Text>
                  <View style={[
                    styles.inputWrap, {
                      backgroundColor: fieldBg,
                      borderColor: confirmFocused ? primaryColorAlpha(0.45): borderColor,
                    }
              ]}>
                <View style={{
                  width: '15%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialIcons name="lock" size={20} color={theme.textMuted}/>
                </View>

                <TextInput includeFontPadding={false}
                value={confirmPasswordText}
                onChangeText={setConfirmPasswordText}
                onFocus={()=> setConfirmFocused(true)}
                onBlur={()=> setConfirmFocused(false)}
                secureTextEntry={confirmPassword}
                placeholder="Confrim Password"
                style={[styles.input, {color: titleColor, width: '75%'}]}
                />

                <Pressable
                onPress = {()=>{
                  // console.log('tapped');
                  setConfirmPassword((confirmPassword) => !confirmPassword)
                }} 
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  // backgroundColor: 'green',
                  paddingHorizontal: 10,
                }}>
                  {confirmPassword ? <MaterialIcons name = "visibility-off" size={20} color={theme.textMuted}/>: <MaterialIcons name = "visibility" size={20} color={theme.textMuted}/>}
                </Pressable>
              </View>
                </View>}

              {!isCreateAccount && <Pressable
                style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled,]}
                onPress={handleContinue}
                disabled={!canContinue}
              >
                <LinearGradient
                  colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>CONTINUE</Text>
                </LinearGradient>
              </Pressable>}

              {/* <Pressable style={styles.helpLink}>
                <Text style={[styles.helpLinkText, { color: bodyColor }]}>Need help signing in?</Text>
              </Pressable> */}
            </View>
            {emailTaken && <View>
              <Text style={{
                ...fontSize.b5,
                color: 'red'
              }}>
                Email is already taken. Provide a different email
              </Text>
              </View>}

              {!isCreateAccount && <View>
             {!!authError && <View style={{ marginTop: 8 }}>
              <Text style={{
                ...fontSize.b5,
                color: '#dc2626',
              }}>
                {authError}
              </Text>
             </View>}
             <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <Text style={[styles.dividerText, { color: footerMuted }]}>or explore</Text>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            </View>

            <View style={styles.socialGrid}>
              <Pressable style={[styles.socialButton, { backgroundColor: fieldBg, borderColor }]}>
                <GoogleIcon height={18} width={18} />
                <Text style={[styles.socialText, { color: titleColor }]}>Google</Text>
              </Pressable>

              <Pressable style={[styles.socialButton, { backgroundColor: fieldBg, borderColor }]}>
                <AppleIcon height={16} width={16} />
                <Text style={[styles.socialText, { color: titleColor }]}>Apple</Text>
              </Pressable>
            </View>
            </View>}
          </View>

          {!isCreateAccount && <View style={styles.footer}>
            <Text style={[styles.footerPrompt, { color: footerMuted }]}>New to Kulsah?</Text>
            <Pressable onPress={()=>{
              setIsCreateAccount(true);
              setIsPhone(false);

            }}>
              <Text style={styles.footerAction}>Create an Account</Text>
            </Pressable>
          </View>}

          
        </ScrollView>
        {isCreateAccount && <Pressable
                style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled, {
                  marginHorizontal: '5%',
                  width: '90%',
                  marginBottom: keyboardHeight ? 24 : (Platform.OS === 'ios' ? 54 : insets.bottom + 54),
                  position: 'absolute',
                  right: 0,
                  left: 0,
                  bottom: 0,
                }]}
                onPress={handleContinue}
                disabled={!canContinue}
              >
                <LinearGradient
                  colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>CONTINUE</Text>
                </LinearGradient>
              </Pressable>}
      </View>
    </SafeAreaView>
    <Modal
    visible = {showDate}
    animationType='fade'
    transparent = {true}
    statusBarTranslucent = {true}
    // onDismiss = {()=>{
    //   setShowDate(false);
    //   inputRef.current?.blur();
    // }}
    >
      <View style={{
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'green',
      }}>
        <View style={{
          // height: 200,
          width: '90%',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: Platform.OS === 'ios' ? 200 : 0,
          // backgroundColor: 'blue',
          // alignSelf: '',
          // backgroundColor: Platform.OS === 'ios' ? '#ffffff22' : 'transparent',
        }}>
          <DateTimePicker
          value={eventDate}
          mode="date"
          display="spinner"
          onChange={onChange}
          textColor= {theme.text}
        />
        </View>

        {Platform.OS === 'ios' &&  
        <Pressable
        style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled, {
                  marginHorizontal: '5%',
                  width: '90%',
                  marginBottom: 54,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  // backgroundColor: 'red',
        }]}
        onPress={()=>{
          setShowDate(false);
          handleContinue();
        }}
        disabled={!canContinue}
        >
                <LinearGradient
                  colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>CONTINUE</Text>
                </LinearGradient>
          
          </Pressable>}
      </View>
    </Modal>
    <Modal
    visible={showGenderDropdown}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setShowGenderDropdown(false)}
    >
      <Pressable
        style={[styles.dropdownBackdrop, { backgroundColor: modalBackdrop }]}
        onPress={() => setShowGenderDropdown(false)}
      >
        <Pressable style={[styles.dropdownSheet, { backgroundColor: theme.background, borderColor }]}>
          {genderOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setGender(option);
                setShowGenderDropdown(false);
              }}
              style={[
                styles.dropdownOption,
                {
                  borderBottomColor: borderColor,
                  backgroundColor: gender === option ? primaryColorAlpha(0.12) : 'transparent',
                },
              ]}
            >
              <Text style={[styles.dropdownOptionText, { color: titleColor }]}>{option}</Text>
              {gender === option && <MaterialIcons name="check" size={20} color={PRIMARY_COLOR} />}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
    <Modal
      visible={showCountryDropdown}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setShowCountryDropdown(false)}
    >
      <Pressable
        style={[styles.dropdownBackdrop, { backgroundColor: modalBackdrop }]}
        onPress={() => setShowCountryDropdown(false)}
      >
        <Pressable style={[styles.dropdownSheet, { backgroundColor: theme.background, borderColor }]}>
          {COUNTRY_OPTIONS.map((option) => {
            const isSelected = option.cca2 === countryCode;
            return (
              <Pressable
                key={option.cca2}
                onPress={() => onSelectCountry(option)}
                style={[
                  styles.dropdownOption,
                  {
                    borderBottomColor: borderColor,
                    backgroundColor: isSelected ? primaryColorAlpha(0.12) : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.dropdownOptionText, { color: titleColor }]}>
                  {option.label}
                </Text>
                <Text style={[styles.dropdownMetaText, { color: theme.textMuted }]}>
                  {`${option.cca2} +${option.callingCode}`}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
    <Modal
    visible={isLoading}
    animationType="fade"
    transparent={true}
    statusBarTranslucent={true}
    // onRequestClose={() => setShowGenderDropdown(false)}
    >
    <View
    style={{
      height: '100%',
      width: '100%',
      backgroundColor: modalBackdrop,
      alignItems: 'center',
      justifyContent: 'center'
    }}
    >
      <DotTrioLoader/>
    </View>
    </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    // backgroundColor: 'blue',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 400,
    height: 400,
    top: -70,
    right: -130,
  },
  blobBottom: {
    width: 320,
    height: 320,
    bottom: -90,
    left: -110,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperHeader: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    // borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 40,
  },
  stepperBody: {
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  stepperConnector: {
    flex: 1,
    height: 2,
    borderRadius: 999,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    // backgroundColor: 'blue'
  },
  card: {
    borderRadius: 28,
    borderWidth: 0,
    paddingHorizontal: 22,
    paddingVertical: 28,
    overflow: 'hidden',
    // shadowOpacity: 0.16,
    // shadowRadius: 28,
    // shadowOffset: { width: 0, height: 18 },
    // elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brandTitle: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  brandSubtitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  formBlock: {
    gap: 16,
  },
  inputWrap: {
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: 10,
    flexDirection: 'row',
    // gap: 5,
    // paddingTop: 14,
  },
  genderIconWrap: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderValue: {
    width: '70%',
    fontSize: fontSize.b2.fontSize + (mediumScreen ? 6: 2),
    fontFamily: fontSize.b3.fontFamily,
    lineHeight: fontSize.b2.lineHeight + (mediumScreen ? 8: 4),
    alignSelf: 'center',
  },
  genderChevronWrap: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    position: 'absolute',
    left: 16,
  },
  input: {
    // height: 40,
    // paddingTop: 5,
    width: '75%',
    fontSize: fontSize.b2.fontSize + (mediumScreen ? 6: 2), 
    fontFamily: fontSize.b3.fontFamily,
    lineHeight: fontSize.b2.lineHeight + (mediumScreen ? 8: 4),
  },
  primaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.36,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
    // width: '90%',
  
  },
  primaryButtonDisabled: {
    opacity: 0.48,
  },
  primaryGradient: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 1.2,
  },
  helpLink: {
    alignItems: 'center',
    paddingTop: 4,
  },
  helpLinkText: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingTop: 2,
    paddingBottom: 4,
  },
  forgotPasswordText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
    // marginTop: 20,
  },
  socialButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  socialText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
    gap: 10,
    // backgroundColor: 'pink'
  },
  footerPrompt: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerAction: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  dropdownBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownSheet: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    minHeight: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionText: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  dropdownMetaText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
});

export default EmailPhone;

