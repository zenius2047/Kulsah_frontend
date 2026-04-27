import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface CreatorOnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'pre' | 'signup' | 'identity' | 'story' | 'monetization' | 'success';
type SignupMethod = 'select' | 'email' | 'phone';
type MonetizationSubStep = 'list' | 'payout' | 'subscription' | 'store';

const CATEGORIES = [
  { id: 'music', label: 'Music' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'film', label: 'Film' },
  { id: 'edu', label: 'Education' },
  { id: 'art', label: 'Art' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'dance', label: 'Dance' }
];

const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'USA', 'France', 'Germany', 'Japan', 'United Arab Emirates'];
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Nigeria': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi'],
  'Kenya': ['Mombasa', 'Kisumu', 'Nakuru'],
  'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow'],
  'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman'],
};

const STYLE_TAGS = [
  'Live Shows', 'Music', 'Comedy', 'Film', 'Dance', 'Art & Design', 'Culture', 'Education', 'Tech', 'Wellness', 'Urban Vibes'
];

const CreatorOnboarding: React.FC<CreatorOnboardingProps> = ({ onComplete }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<OnboardingStep>('pre');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('select');
  const [monSubStep, setMonSubStep] = useState<MonetizationSubStep>('list');
  const [progress, setProgress] = useState(0);

  // Auth State
  const [authData, setAuthData] = useState({
    email: '',
    phone: '',
    password: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    country: '',
    city: '',
    bio: '',
    whatYouCreate: '',
    tags: [] as string[],
    handle: '',
    kulsahId: ''
  });

  const [hasManuallyEditedHandle, setHasManuallyEditedHandle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const steps: OnboardingStep[] = ['pre', 'signup', 'identity', 'story', 'monetization', 'success'];
    const idx = steps.indexOf(step);
    setProgress((idx / (steps.length - 1)) * 100);
  }, [step]);

  const generateCreatorIdentity = async (force = false) => {
    // Don't overwrite if the user has already customized their handle manually
    if ((!formData.name && !force) || (hasManuallyEditedHandle && !force)) return;
    
    setIsGenerating(true);
    const baseName = formData.name || 'Star_Creator';
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a unique creator handle and a Kulsah ID (Format: KUL-XXXX-XX) for an artist named "${baseName}". Output only JSON: {"handle": "@handle", "id": "KUL-0000-AA"}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text || '{}');
      setFormData(prev => ({ 
        ...prev, 
        handle: data.handle || `@kulsah/${baseName.toLowerCase().replace(/\s/g, '_')}`,
        kulsahId: data.id || `KUL-${Math.floor(1000 + Math.random() * 9000)}-AA`
      }));
    } catch (e) {
      console.error("Identity Generation Failed", e);
      setFormData(prev => ({ 
        ...prev, 
        handle: `@kulsah/${baseName.toLowerCase().replace(/\s/g, '_')}`,
        kulsahId: `KUL-9382-AB`
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHandleChange = (val: string) => {
    setHasManuallyEditedHandle(true);
    // Ensure it starts with @ if they start typing
    let cleanVal = val;
    if (val && !val.startsWith('@')) cleanVal = '@' + val;
    setFormData({ ...formData, handle: cleanVal });
  };

  const skipIdentity = async () => {
    if (!formData.handle) {
      await generateCreatorIdentity(true);
    }
    setStep('story');
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }));
  };

  // Monetization State
  const [monState, setMonState] = useState({
    payoutMethod: '',
    payoutDetails: '',
    subscriptionPrice: '4.99',
    payoutConfigured: false,
    subscriptionConfigured: false,
  });

  const renderPreOnboarding = () => (
    <View>
      <View>
        <View>
          <View>
            <Text>rocket_launch</Text>
          </View>
          <Text>Join the{'\\n'}Creator Galaxy</Text>
          <Text>Your journey to stardom begins here.</Text>
        </View>

        <View>
          {[
            { icon: 'stars', title: 'Earn from subscriptions & tickets', desc: 'Direct monetization from your true fans.' },
            { icon: 'videocam', title: 'Upload videos & go live', desc: 'Broadcast in high-fidelity to your community.' },
            { icon: 'public', title: 'Reach fans across Africa & beyond', desc: 'Global distribution with deep local focus.' },
          ].map((item, i) => (
            <View key={i}>
              <View>
                <Text>{item.icon}</Text>
              </View>
              <View>
                <Text>{item.title}</Text>
                <Text>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      <Pressable 
        onPress={() => setStep('signup')}
       
      >
        <View></View>
        <Text>Start Creating</Text>
        <Text>arrow_forward</Text>
      </Pressable>
    </View>
  );

  const renderSignupSelection = () => (
    <View>
      <View>
        <View>
          <Text>Access Your Orbit</Text>
          <Text>Choose your preferred entry method.</Text>
        </View>

        <View>
          <Pressable 
            onPress={() => setSignupMethod('email')}
           
          >
            <Text>mail</Text>
            Continue with Email
          </Pressable>
          
          <Pressable 
            onPress={() => setSignupMethod('phone')}
           
          >
            <Text>phone_iphone</Text>
            Continue with Phone
          </Pressable>
          
          <View>
            <View></View>
            <Text>Global Auth</Text>
            <View></View>
          </View>

          <View>
            <Pressable>
              <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }} />
              Google
            </Pressable>
            <Pressable>
              <Text>apple</Text>
              Apple
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSignupForm = () => (
    <View>
      <View>
        <View>
          <Text>
            {signupMethod === 'email' ? 'Email Auth' : 'Phone Auth'}
          </Text>
          <Text>Verify your coordinates to proceed.</Text>
        </View>

        <View>
          <View>
            <Text>
              {signupMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </Text>
            <View>
              <TextInput 
                type={signupMethod === 'email' ? 'email' : 'tel'}
                value={signupMethod === 'email' ? authData.email : authData.phone}
                onChangeText={(value) => setAuthData({
                  ...authData, 
                  [signupMethod === 'email' ? 'email' : 'phone']: value
                })}
               
                placeholder={signupMethod === 'email' ? 'Enter your email' : 'e.g. +234 812 345 6789'}
              />
              <Text>
                {signupMethod === 'email' ? 'alternate_email' : 'phone_android'}
              </Text>
            </View>
          </View>

          <View>
            <Text>Password</Text>
            <View>
              <TextInput 
                type="password"
                value={authData.password}
                onChangeText={(value) => setAuthData({...authData, password: value})}
               
                placeholder="Min. 8 characters"
              />
              <Text>lock</Text>
            </View>
          </View>

          <Pressable 
            onPress={() => setSignupMethod('select')}
           
          >
            Change Entry Method
          </Pressable>
        </View>
      </View>

      <View>
        <Pressable 
          onPress={() => setStep('identity')}
          disabled={authData.password.length < 8 || (signupMethod === 'email' ? !authData.email : !authData.phone)}
         
        >
          <View></View>
          <Text>Initialize Account</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderIdentity = () => {
    const availableCities = formData.country ? CITIES_BY_COUNTRY[formData.country] || [] : [];

    return (
      <View>
        <View>
          <Text>Creator Identity</Text>
          <Text>Let's define your stage presence in the galaxy.</Text>
        </View>

        <View>
          <View>
            <Text>Creator Name</Text>
            <TextInput 
              value={formData.name}
              onChangeText={(value) => setFormData({...formData, name: value})}
              onBlur={() => generateCreatorIdentity()}
             
              placeholder="e.g. Kojo Beats"
            />
          </View>

          {formData.handle && (
            <View>
              <View>
                <Text>verified</Text>
              </View>
              <View>
                <Text>System Identity Card {hasManuallyEditedHandle && '• Manual Mode'}</Text>
                {isGenerating && <View></View>}
              </View>
              <View>
                <View>
                  <Text>Creator Handle</Text>
                  <View>
                    <TextInput 
                      value={formData.handle}
                      onChangeText={(value) => handleHandleChange(value)}
                     
                    />
                    <Text>edit</Text>
                  </View>
                </View>
                <View></View>
                <View>
                  <Text>Unique Kulsah ID</Text>
                  <View>
                    <TextInput 
                      value={formData.kulsahId}
                      onChangeText={(value) => setFormData({...formData, kulsahId: value})}
                     
                    />
                    <Text>lock_open</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View>
            <Text>Category</Text>
            <View>
              <View 
                value={formData.category}
                onChangeText={(value) => setFormData({...formData, category: value})}
               
              >
                <Text value="" disabled>Select a category...</Text>
                {CATEGORIES.map(cat => (
                  <Text key={cat.id} value={cat.label}>{cat.label}</Text>
                ))}
              </View>
              <Text>keyboard_arrow_down</Text>
            </View>
          </View>

          <View>
            <View>
              <Text>Country</Text>
              <View>
                <View 
                  value={formData.country}
                  onChangeText={(value) => setFormData({...formData, country: value, city: ''})}
                 
                >
                  <Text value="" disabled>Select Country</Text>
                  {COUNTRIES.map(country => (
                    <Text key={country} value={country}>{country}</Text>
                  ))}
                </View>
                <Text>expand_more</Text>
              </View>
            </View>
            <View>
              <Text>City</Text>
              <View>
                <View 
                  value={formData.city}
                  onChangeText={(value) => setFormData({...formData, city: value})}
                  disabled={!formData.country}
                 
                >
                  <Text value="" disabled>Select City</Text>
                  {availableCities.map(city => (
                    <Text key={city} value={city}>{city}</Text>
                  ))}
                </View>
                <Text>location_city</Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <Pressable 
            disabled={!formData.name || !formData.category || !formData.country || !formData.city}
            onPress={() => setStep('story')}
           
          >
            <View></View>
            <Text>Continue</Text>
          </Pressable>
          <Pressable 
            onPress={skipIdentity}
           
          >
            Skip for now
          </Pressable>
        </View>
      </View>
    );
  };

  const renderStory = () => (
    <View>
      <View>
        <Text>Creator Story</Text>
        <Text>Tell your future fans what makes you unique.</Text>
      </View>

      <View>
        <View>
          <View>
            <Text>Bio (160 characters)</Text>
            <Text>{formData.bio.length}/160</Text>
          </View>
          <TextInput 
            value={formData.bio}
            onChangeText={(value) => setFormData({...formData, bio: value})}
           
            placeholder="e.g. Afrobeats producer blending traditional rhythms with synthwave textures."
          />
        </View>

        <View>
          <Text>What do you create?</Text>
          <TextInput 
            value={formData.whatYouCreate}
            onChangeText={(value) => setFormData({...formData, whatYouCreate: value})}
           
            placeholder="e.g. Daily beats and live studio sessions"
          />
        </View>

        <View>
          <Text>Inspiration / Style Tags</Text>
          <View>
            {STYLE_TAGS.map(tag => (
              <Pressable 
                key={tag}
                onPress={() => toggleTag(tag)}
               
              >
                {tag}
                {formData.tags.includes(tag) && <Text>close</Text>}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View>
        <Pressable 
          onPress={() => setStep('monetization')}
         
        >
          <View></View>
          <Text>Next</Text>
        </Pressable>
        <Pressable 
          onPress={() => setStep('monetization')}
         
        >
          Skip Story setup
        </Pressable>
      </View>
    </View>
  );

  const renderMonetizationList = () => (
    <>
      <View>
        <View>
          <Text>payments</Text>
        </View>
        <Text>Monetization</Text>
        <Text>Secure your earnings. Set up your base membership tiers and payout methods now.</Text>
      </View>

      <View>
        {[
          { 
            id: 'payout', 
            label: 'Connect Payout Method', 
            icon: 'account_balance', 
            desc: monState.payoutConfigured ? 'Connected: ' + monState.payoutMethod : 'Bank or Momo for safe payouts.', 
            color: 'text-blue-400',
            done: monState.payoutConfigured
          },
          { 
            id: 'subscription', 
            label: 'Set Base Subscription', 
            icon: 'stars', 
            desc: monState.subscriptionConfigured ? `Price set: $${monState.subscriptionPrice}` : 'Define your monthly fan price.', 
            color: 'text-primary',
            done: monState.subscriptionConfigured
          },
          { 
            id: 'store', 
            label: 'Digital Store Items', 
            icon: 'shopping_bag', 
            desc: 'Upload exclusive digital items.', 
            color: 'text-orange-400',
            done: false
          },
        ].map((item, i) => (
          <View 
            key={i} 
            onPress={() => setMonSubStep(item.id as MonetizationSubStep)}
           
          >
            <View>
               <View>
                  <Text>{item.id}</Text>
               </View>
               <View>
                  <Text>
                    {item.label}
                    {item.done && <Text>check_circle</Text>}
                  </Text>
                  <Text>{item.desc}</Text>
               </View>
            </View>
            <Text>chevron_right</Text>
          </View>
        ))}
      </View>

      <View>
        <Pressable 
          onPress={() => setStep('success')}
         
        >
          <View></View>
          <Text>
            {monState.payoutConfigured || monState.subscriptionConfigured ? 'Continue Setup' : 'Complete Setup'}
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setStep('success')}
         
        >
          Skip for now
        </Pressable>
      </View>
    </>
  );

  const renderPayoutSetup = () => (
    <View>
      <View>
        <Pressable onPress={() => setMonSubStep('list')}>
          <Text>chevron_left</Text>
        </Pressable>
        <Text>Payout Method</Text>
      </View>

      <View>
        <View>
          <Text>Select Gateway</Text>
          <View>
            {[
              { id: 'Momo', label: 'Mobile Money', icon: 'smartphone' },
              { id: 'Bank', label: 'Local Bank', icon: 'account_balance' }
            ].map(m => (
              <Pressable 
                key={m.id}
                onPress={() => setMonState({...monState, payoutMethod: m.id})}
               
              >
                <Text>{m.icon}</Text>
                {m.label}
              </Pressable>
            ))}
          </View>
        </View>

        {monState.payoutMethod && (
          <View>
            <View>
              <Text>
                {monState.payoutMethod === 'Momo' ? 'Phone Number' : 'Account Number'}
              </Text>
              <TextInput 
                value={monState.payoutDetails}
                onChangeText={(value) => setMonState({...monState, payoutDetails: value})}
               
                placeholder={monState.payoutMethod === 'Momo' ? 'e.g. +234 812...' : 'e.g. 1029384756'}
              />
            </View>
            <Pressable 
              onPress={() => {
                setMonState({...monState, payoutConfigured: !!monState.payoutDetails});
                setMonSubStep('list');
              }}
             
            >
              Verify & Connect
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const renderSubscriptionSetup = () => (
    <View>
      <View>
        <Pressable onPress={() => setMonSubStep('list')}>
          <Text>chevron_left</Text>
        </Pressable>
        <Text>Base Tier Price</Text>
      </View>

      <View>
        <Text>Fans will pay this monthly fee to unlock your Premium content and support your journey.</Text>
        
        <View>
          <Text>$</Text>
          <TextInput 
            type="number"
            value={monState.subscriptionPrice}
            onChangeText={(value) => setMonState({...monState, subscriptionPrice: value})}
           
          />
        </View>

        <View>
           {['2.99', '4.99', '9.99'].map(price => (
             <Pressable 
               key={price}
               onPress={() => setMonState({...monState, subscriptionPrice: price})}
              
             >
               ${price}
             </Pressable>
           ))}
        </View>

        <Pressable 
          onPress={() => {
            setMonState({...monState, subscriptionConfigured: true});
            setMonSubStep('list');
          }}
         
        >
          Save Subscription Price
        </Pressable>
      </View>
    </View>
  );

  const renderMonetization = () => (
    <View>
      {monSubStep === 'list' && renderMonetizationList()}
      {monSubStep === 'payout' && renderPayoutSetup()}
      {monSubStep === 'subscription' && renderSubscriptionSetup()}
      {monSubStep === 'store' && (
        <View>
           <Text>shopping_bag</Text>
           <Text>Coming Soon</Text>
           <Text>The Store feature is launching next cycle.</Text>
           <Pressable onPress={() => setMonSubStep('list')}>Back</Pressable>
        </View>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View>
       <View>
          <View></View>
          <View>
             <View>
                <Text>verified</Text>
             </View>
          </View>
       </View>

       <View>
          <Text>Galaxy Registered</Text>
          <Text>Welcome to the inner circle, {'\\n'}<Text>{formData.name || 'Visionary'}</Text>.</Text>
       </View>

       <View>
          <View>
             <Text>Handle</Text>
             <Text>{formData.handle}</Text>
          </View>
          <View>
             <Text>ID</Text>
             <Text>{formData.kulsahId}</Text>
          </View>
       </View>

       <Pressable 
        onPress={onComplete}
       
       >
         <View></View>
         <Text>Enter Dashboard</Text>
       </Pressable>
    </View>
  );

  return (
    <View>
      {/* Top Progress Indicator */}
      {step !== 'pre' && step !== 'success' && (
        <View>
          <View 
           
            style={{ width: `${progress}%` }}
          />
        </View>
      )}

      {/* Navigation Header */}
      {step !== 'pre' && step !== 'success' && (
        <View>
          <Pressable 
            onPress={() => {
              if (step === 'signup' && signupMethod !== 'select') {
                setSignupMethod('select');
                return;
              }
              if (step === 'monetization' && monSubStep !== 'list') {
                setMonSubStep('list');
                return;
              }
              const steps: OnboardingStep[] = ['pre', 'signup', 'identity', 'story', 'monetization', 'success'];
              const currentIdx = steps.indexOf(step);
              if (currentIdx > 0) setStep(steps[currentIdx - 1]);
            }}
           
          >
            <Text>chevron_left</Text>
          </Pressable>
          <View>
            <Text>Kulsah</Text>
          </View>
          <View></View>
        </View>
      )}

      <View>
        {step === 'pre' && renderPreOnboarding()}
        {step === 'signup' && (signupMethod === 'select' ? renderSignupSelection() : renderSignupForm())}
        {step === 'identity' && renderIdentity()}
        {step === 'story' && renderStory()}
        {step === 'monetization' && renderMonetization()}
        {step === 'success' && renderSuccess()}
      </View>

      {/* Cosmic Ambiance */}
      <View></View>
      <View></View>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% -200%; }
          100% { background-position: 200% 200%; }
        }
        .shadow-glow {
          box-shadow: 0 0 40px rgba(205, 43, 238, 0.4);
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </View>
  );
};

export default CreatorOnboarding;
