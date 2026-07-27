import { View, Text, Dimensions } from 'react-native'
import React from 'react'
import { useTheme } from '@react-navigation/native'
import { useThemeMode } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import K from '../assets/icons/k.svg'
import { mediumScreen } from '../types';
import { fontSize } from './typography';
import KulsahBlack from '../assets/icons/kulsah-black-svg.svg';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');

const SplashScreen: React.FC= () => {


const {isDark, theme} = useThemeMode();
  return (
    <SafeAreaView
    edges={['left', 'right']}
    style={{
        flex: 1,
        backgroundColor: isDark ? 'black': 'white',
        alignItems: 'center',
        justifyContent: 'center'
    }}>

    <View style={{
        // backgroundColor: 'red',
        // height: 50,
        width: SCREEN_WIDTH,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'

    }}>
    {isDark ? <KulsahWhite height={mediumScreen ? 100:90} width='100%'/> : <KulsahBlack height={mediumScreen ? 100:90} width='100%'/>}    {/* <View style={{
        // position: 'relative',
        // top: '35%',
        left: -19,
        top:10
    }}>
        <View style={{
            alignItems: 'flex-end'
        }}>
            <Text style={{
            ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
            letterSpacing: 0.5,
            color: isDark ? 'white': 'black'
                }}>
                ulsah
            </Text>
            <Text style={{
            ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
            color: isDark ? 'white': 'black',
            letterSpacing: 0.4
                }}>
                ...the creator galaxy
            </Text>
        </View>
    </View> */}
    </View>
    </SafeAreaView>
  )
}

export default SplashScreen