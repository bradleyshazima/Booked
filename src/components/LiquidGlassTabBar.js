import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  RoundedRect,
  Blur,
  BackdropFilter,
  LinearGradient,
  vec,
  RuntimeShader,
  Skia,
  Group,
  Circle,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const TAB_BAR_MARGIN = 16;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;

const liquidGlassShader = Skia.RuntimeEffect.Make(`
uniform float time;
uniform vec2 resolution;
uniform vec3 touch;

vec2 distort(vec2 p, float time) {
  float wave1 = sin(p.x * 8.0 + time * 3.0) * 0.02;
  float wave2 = cos(p.y * 6.0 - time * 2.0) * 0.02;
  float wave3 = sin((p.x + p.y) * 5.0 + time * 4.0) * 0.015;
  
  // Add touch interaction
  vec2 touchPos = touch.xy;
  float touchRadius = touch.z;
  float dist = distance(p * resolution, touchPos);
  float touchWave = smoothstep(touchRadius, 0.0, dist) * 0.05 * sin(dist * 0.1 - time * 10.0);
  
  return vec2(wave1 + wave3 + touchWave, wave2 + wave3 + touchWave);
}

half4 main(vec2 pos) {
  vec2 uv = pos / resolution;
  vec2 distortedUV = uv + distort(uv, time);
  
  // Chromatic aberration for glass effect
  float r = 1.0 + sin(distortedUV.x * 10.0 + time) * 0.01;
  float g = 1.0;
  float b = 1.0 + cos(distortedUV.y * 10.0 - time) * 0.01;
  
  // Fresnel effect
  float fresnel = pow(1.0 - uv.y, 3.0);
  
  // Glass highlights
  float highlight1 = smoothstep(0.0, 0.3, 1.0 - uv.y) * 0.4;
  float highlight2 = smoothstep(0.7, 1.0, uv.y) * 0.2;
  
  float alpha = 0.12 + fresnel * 0.15 + highlight1 + highlight2;
  
  return half4(r, g, b, alpha);
}
`)?.makeShader();

const LiquidGlassTabBar = ({ state, descriptors, navigation }) => {
  const tabScales = useRef(state.routes.map(() => useSharedValue(1))).current;
  const tabRotations = useRef(state.routes.map(() => useSharedValue(0))).current;
  const glowOpacities = useRef(state.routes.map(() => useSharedValue(0))).current;
  const rippleScales = useRef(state.routes.map(() => useSharedValue(0))).current;
  
  const time = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const touchRadius = useSharedValue(0);

  // Animate shader
  useEffect(() => {
    const animate = () => {
      time.value = withTiming(time.value + 0.016, {
        duration: 16,
        easing: Easing.linear,
      }, () => {
        if (time.value > 100) time.value = 0;
      });
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, []);

  const handleTabPress = (index, isFocused, event) => {
    // Get touch position
    touchX.value = event.nativeEvent.locationX;
    touchY.value = event.nativeEvent.locationY;
    touchRadius.value = withSequence(
      withTiming(100, { duration: 400 }),
      withTiming(0, { duration: 600 })
    );

    const tabEvent = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (!isFocused && !tabEvent.defaultPrevented) {
      // Bounce animation
      tabScales[index].value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(0.95, { damping: 8, stiffness: 180 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );

      // Rotation wiggle
      tabRotations[index].value = withSequence(
        withSpring(10, { damping: 8, stiffness: 200 }),
        withSpring(-10, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 10, stiffness: 150 })
      );

      // Glow pulse
      glowOpacities[index].value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );

      // Ripple effect
      rippleScales[index].value = 0;
      rippleScales[index].value = withTiming(2, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });

      navigation.navigate(state.routes[index].name);
    }
  };

  const getIconName = (routeName, focused) => {
    const icons = {
      Library: focused ? 'library' : 'library-outline',
      Upload: focused ? 'add-circle' : 'add-circle-outline',
      Progress: focused ? 'stats-chart' : 'stats-chart-outline',
    };
    return icons[routeName];
  };

  return (
    <View style={styles.container}>
      {/* Advanced Liquid Glass Background */}
      <Canvas style={styles.canvas}>
        <BackdropFilter
          filter={<Blur blur={25} mode="clamp" />}
          clip={
            <RoundedRect
              x={0}
              y={0}
              width={TAB_BAR_WIDTH}
              height={TAB_BAR_HEIGHT}
              r={26}
            />
          }
        >
          {/* Base glass layer */}
          <RoundedRect
            x={0}
            y={0}
            width={TAB_BAR_WIDTH}
            height={TAB_BAR_HEIGHT}
            r={26}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, TAB_BAR_HEIGHT)}
              colors={[
                'rgba(255, 255, 255, 0.18)',
                'rgba(255, 255, 255, 0.08)',
                'rgba(255, 255, 255, 0.12)',
              ]}
            />
          </RoundedRect>
        </BackdropFilter>

        {/* Top reflection */}
        <RoundedRect
          x={0}
          y={0}
          width={TAB_BAR_WIDTH}
          height={TAB_BAR_HEIGHT * 0.4}
          r={26}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, TAB_BAR_HEIGHT * 0.4)}
            colors={[
              'rgba(255, 255, 255, 0.35)',
              'rgba(255, 255, 255, 0.0)',
            ]}
          />
        </RoundedRect>

        {/* Bottom shadow */}
        <RoundedRect
          x={0}
          y={TAB_BAR_HEIGHT * 0.7}
          width={TAB_BAR_WIDTH}
          height={TAB_BAR_HEIGHT * 0.3}
          r={26}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, TAB_BAR_HEIGHT * 0.3)}
            colors={[
              'rgba(0, 0, 0, 0.0)',
              'rgba(0, 0, 0, 0.15)',
            ]}
          />
        </RoundedRect>

        {/* Border glow */}
        <RoundedRect
          x={0.5}
          y={0.5}
          width={TAB_BAR_WIDTH - 1}
          height={TAB_BAR_HEIGHT - 1}
          r={25.5}
          style="stroke"
          strokeWidth={1.5}
          color="rgba(255, 255, 255, 0.3)"
        />
        
        <RoundedRect
          x={2}
          y={2}
          width={TAB_BAR_WIDTH - 4}
          height={TAB_BAR_HEIGHT - 4}
          r={24}
          style="stroke"
          strokeWidth={1}
          color="rgba(255, 255, 255, 0.1)"
        />
      </Canvas>

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const animatedStyle = useAnimatedStyle(() => ({
            transform: [
              { scale: tabScales[index].value },
              { rotate: `${tabRotations[index].value}deg` },
            ],
          }));

          const glowStyle = useAnimatedStyle(() => ({
            opacity: glowOpacities[index].value,
          }));

          const rippleStyle = useAnimatedStyle(() => ({
            transform: [{ scale: rippleScales[index].value }],
            opacity: 1 - rippleScales[index].value * 0.5,
          }));

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={(e) => handleTabPress(index, isFocused, e)}
              style={styles.tabButton}
            >
              {/* Ripple effect */}
              <Animated.View style={[styles.ripple, rippleStyle]}>
                <Canvas style={styles.rippleCanvas}>
                  <Circle cx={30} cy={30} r={30} color="rgba(99, 102, 241, 0.3)" />
                </Canvas>
              </Animated.View>

              <Animated.View style={[styles.tabContent, animatedStyle]}>
                {/* Glow effect */}
                <Animated.View
                  style={[
                    styles.glowContainer,
                    glowStyle,
                    {
                      shadowColor: isFocused ? '#6366f1' : '#ffffff',
                    },
                  ]}
                >
                  <Ionicons
                    name={getIconName(route.name, isFocused)}
                    size={isFocused ? 30 : 26}
                    color={isFocused ? '#6366f1' : 'rgba(255, 255, 255, 0.7)'}
                  />
                </Animated.View>

                {/* Label */}
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? '#6366f1'
                        : 'rgba(255, 255, 255, 0.7)',
                      fontWeight: isFocused ? '700' : '500',
                      fontSize: isFocused ? 12 : 11,
                    },
                  ]}
                >
                  {options.title || route.name}
                </Animated.Text>

                {/* Active indicator with gradient */}
                {isFocused && (
                  <View style={styles.activeIndicator}>
                    <Canvas style={styles.indicatorCanvas}>
                      <RoundedRect x={0} y={0} width={50} height={5} r={2.5}>
                        <LinearGradient
                          start={vec(0, 0)}
                          end={vec(50, 0)}
                          colors={['#a78bfa', '#818cf8', '#6366f1', '#4f46e5', '#4338ca']}
                        />
                      </RoundedRect>
                      <RoundedRect x={0} y={0} width={50} height={5} r={2.5}>
                        <Blur blur={4} />
                      </RoundedRect>
                    </Canvas>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: TAB_BAR_MARGIN,
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    borderRadius: 26,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  canvas: {
    position: 'absolute',
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 15,
  },
  label: {
    marginTop: 5,
    letterSpacing: 0.3,
  },
  activeIndicator: {
    marginTop: 7,
    width: 50,
    height: 5,
  },
  indicatorCanvas: {
    width: 50,
    height: 5,
  },
  ripple: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  rippleCanvas: {
    width: 60,
    height: 60,
  },
});

export default LiquidGlassTabBar;