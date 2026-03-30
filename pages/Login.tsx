import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { UserRole } from '../types';

const ElephantLogo = ({ className = "size-8", color = "#cd2bee" }: { className?: string, color?: string }) => (
  <Image 
    source={{ uri: "https://img.icons8.com/ios-filled/150/ffffff/elephant.png" }} 
    
   
    style={{ filter: `drop-shadow(0 0 10px ${color}44)` }}
  />
);

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const incomingRole = (route.params as { role?: UserRole })?.role;
  
  // Default to 'fan' as requested
  const [role, setRole] = useState<UserRole>(incomingRole || 'fan');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const accentColor = role === 'creator' ? '#cd2bee' : '#3b82f6';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(role);
  };

  return (
    <View>
      
      {/* Soft Atmosphere */}
      <View>
        <View></View>
        <View></View>
      </View>

      <View>
        
        <View>
          <Pressable 
            onPress={() => navigation.navigate('/')} 
           
          >
            <Text>close</Text>
          </Pressable>
          
          <View>
            <ElephantLogo color="#ffffff" />
          </View>
          
          <View></View>
        </View>

        <View>
          <View>
            <Text>Hub Access</Text>
            <Text>Enter your credentials to synchronize.</Text>
          </View>

          {/* Role Selection Label */}
          <View>
             <View>
              <Pressable 
                onPress={() => setRole('fan')}
               
              >
                Fan
              </Pressable>
              <Pressable 
                onPress={() => setRole('creator')}
               
              >
                Creator
              </Pressable>
            </View>
          </View>

          <View onSubmit={handleSubmit}>
            <View>
              <Text>Coordinates</Text>
              <View>
                <TextInput 
                  required
                  type="email"
                  value={formData.email}
                  onChangeText={(value) => setFormData({...formData, email: value})}
                 
                  style={{ ringColor: `${accentColor}44`, borderColor: formData.email ? accentColor : undefined }}
                  placeholder="name@nebula.io"
                />
              </View>
            </View>

            <View>
              <Text>Access Key</Text>
              <View>
                <TextInput 
                  required
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChangeText={(value) => setFormData({...formData, password: value})}
                 
                  style={{ ringColor: `${accentColor}44`, borderColor: formData.password ? accentColor : undefined }}
                  placeholder="••••••••"
                />
                <Pressable 
                  type="button"
                  onPress={() => setShowPassword(!showPassword)}
                 
                >
                  <Text style={{ color: showPassword ? accentColor : undefined }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Pressable 
                type="submit"
               
              >
                Connect to Galaxy
              </Pressable>
              
              <View>
                {role === 'fan' ? (
                  <Pressable 
                    type="button"
                    onPress={() => setRole('creator')}
                   
                  >
                    Sign in as a creator
                  </Pressable>
                ) : (
                  <Pressable 
                    type="button"
                    onPress={() => setRole('fan')}
                   
                  >
                    Sign in as a fan
                  </Pressable>
                )}
              </View>
              
              <Pressable type="button">
                Lost credentials?
              </Pressable>
            </View>
          </View>

          {/* Social Sign In */}
          <View>
            <View>
              <View></View>
              <Text>Third Party Nodes</Text>
              <View></View>
            </View>

            <View>
              <Pressable>
                <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }} />
                <Text>Google</Text>
              </Pressable>
              <Pressable>
                <Text>apple</Text>
                <Text>Apple</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View>
          <Pressable 
            onPress={() => navigation.navigate('/signup')}
           
          >
            <Text>New Arrival?</Text>
            <Text style={{ color: accentColor }}>
              Initialize Identity
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Login;
