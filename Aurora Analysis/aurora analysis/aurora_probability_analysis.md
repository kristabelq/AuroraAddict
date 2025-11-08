# Aurora Probability Analysis Based on Space Weather Parameters

## Executive Summary

This document provides a scientifically-supported framework for predicting aurora probability and characteristics based on five key space weather parameters: Kp Index, Bz Component, Bt (Total Field), Solar Wind Speed, and Solar Wind Density.

---

## Parameter Definitions and Thresholds

### 1. Kp Index (Planetary K-index)
- **Scale**: 0-9
- **Low**: 0-2 (Quiet conditions)
- **Moderate**: 3-5 (Minor to moderate storm)
- **High**: 6-7 (Strong storm)
- **Severe**: 8-9 (Severe to extreme storm)

### 2. Bz Component (IMF North-South)
- **Northward (+)**: +5 nT or greater (unfavorable)
- **Neutral**: -5 to +5 nT (weak coupling)
- **Southward (-)**: -5 to -10 nT (favorable)
- **Strong Southward**: -10 to -20 nT (very favorable)
- **Extreme Southward**: < -20 nT (extremely favorable)

### 3. Bt (Total Magnetic Field)
- **Weak**: < 5 nT
- **Moderate**: 5-10 nT
- **Strong**: 10-20 nT
- **Very Strong**: > 20 nT

### 4. Solar Wind Speed
- **Slow**: < 400 km/s
- **Moderate**: 400-500 km/s
- **Fast**: 500-600 km/s
- **Very Fast**: 600-700 km/s
- **Extreme**: > 700 km/s

### 5. Solar Wind Density
- **Low**: < 5 particles/cm³
- **Normal**: 5-10 particles/cm³
- **High**: 10-20 particles/cm³
- **Very High**: > 20 particles/cm³

---

## Aurora Probability Matrix

### Scenario 1: Extreme Aurora (Probability: 95-100%)
**Conditions:**
- Kp: 8-9
- Bz: < -20 nT (extreme southward)
- Bt: > 20 nT
- Solar Wind Speed: > 700 km/s
- Density: > 10 particles/cm³

**Aurora Characteristics:**
- **Type**: Bright, dynamic aurora with rapid movement
- **Colors**: Intense green (557.7 nm oxygen), red (630 nm oxygen), purple/blue (427.8 nm nitrogen)
- **Structure**: Multiple auroral arcs, coronas, curtains with rapid pulsations
- **Latitude**: Visible down to 40-45° geomagnetic latitude or lower
- **Activity**: Substorms every 1-3 hours, breakups with westward traveling surges
- **Duration**: 6-12+ hours of continuous activity

---

### Scenario 2: Major Aurora (Probability: 85-95%)
**Conditions:**
- Kp: 7-8
- Bz: -15 to -20 nT
- Bt: 15-20 nT
- Solar Wind Speed: 600-700 km/s
- Density: 10-20 particles/cm³

**Aurora Characteristics:**
- **Type**: Very bright, structured aurora with multiple arcs
- **Colors**: Bright green dominates, red upper borders, occasional purple
- **Structure**: Multiple arcs, some corona formation, rapid curtain movement
- **Latitude**: Visible to 45-50° geomagnetic latitude
- **Activity**: Frequent substorms (2-4 hour intervals), clear breakup phases
- **Duration**: 4-8 hours of strong activity

---

### Scenario 3: Strong Aurora (Probability: 70-85%)
**Conditions:**
- Kp: 6-7
- Bz: -10 to -15 nT
- Bt: 10-15 nT
- Solar Wind Speed: 500-600 km/s
- Density: 8-15 particles/cm³

**Aurora Characteristics:**
- **Type**: Bright, active aurora with clear structures
- **Colors**: Bright green, occasional red upper borders
- **Structure**: Multiple arcs, curtains with rayed structure
- **Latitude**: Visible to 50-55° geomagnetic latitude
- **Activity**: Periodic substorms, visible brightening and movement
- **Duration**: 3-6 hours

---

### Scenario 4: Moderate Aurora (Probability: 50-70%)
**Conditions:**
- Kp: 5-6
- Bz: -5 to -10 nT
- Bt: 8-12 nT
- Solar Wind Speed: 450-550 km/s
- Density: 6-12 particles/cm³

**Aurora Characteristics:**
- **Type**: Moderate brightness, structured bands
- **Colors**: Green dominant, faint red possible at higher altitudes
- **Structure**: Single to multiple arcs, some curtain structure
- **Latitude**: Visible to 55-60° geomagnetic latitude
- **Activity**: Slow to moderate movement, occasional brightening
- **Duration**: 2-4 hours

---

### Scenario 5: Minor Aurora (Probability: 30-50%)
**Conditions:**
- Kp: 4-5
- Bz: -3 to -7 nT
- Bt: 5-10 nT
- Solar Wind Speed: 400-500 km/s
- Density: 5-10 particles/cm³

**Aurora Characteristics:**
- **Type**: Faint to moderate glow with occasional structure
- **Colors**: Primarily green, faint yellow-green
- **Structure**: Faint arcs, sometimes diffuse patches
- **Latitude**: Visible at 60-65° geomagnetic latitude
- **Activity**: Slow changes, minimal dynamic activity
- **Duration**: 1-3 hours

---

### Scenario 6: Weak Aurora (Probability: 10-30%)
**Conditions:**
- Kp: 3-4
- Bz: 0 to -5 nT
- Bt: 3-8 nT
- Solar Wind Speed: 350-450 km/s
- Density: 3-8 particles/cm³

**Aurora Characteristics:**
- **Type**: Very faint glow, barely visible
- **Colors**: Faint green, whitish to naked eye
- **Structure**: Diffuse glow, faint arcs near horizon
- **Latitude**: 65-70° geomagnetic latitude only
- **Activity**: Minimal movement
- **Duration**: 30 minutes to 2 hours

---

### Scenario 7: No Aurora (Probability: 0-10%)
**Conditions:**
- Kp: 0-2
- Bz: > 0 nT (northward)
- Bt: < 5 nT
- Solar Wind Speed: < 400 km/s
- Density: < 5 particles/cm³

**Aurora Characteristics:**
- **Type**: None or extremely rare polar cusp aurora
- **Colors**: N/A
- **Structure**: N/A
- **Latitude**: Above 70° only (polar regions)
- **Activity**: None
- **Duration**: N/A

---

## Critical Parameter Interactions

### The Bz Component: Primary Driver
The **Bz component is the most critical parameter** for aurora occurrence. Southward Bz allows magnetic reconnection at the magnetopause, enabling energy transfer.

**Reconnection Electric Field Formula:**
```
E = V × Bz (in mV/m)
```

Where V is solar wind speed and Bz is the southward component.

### Enhanced Scenarios

#### High-Speed Stream with Moderate Bz
**Conditions:**
- Kp: 5-6
- Bz: -7 to -10 nT
- Speed: 600-700 km/s
- Bt: 8-12 nT
- Density: 5-8 particles/cm³

**Result**: Probability 60-75%
- Fast-moving, filamentary aurora
- Rapid pulsations
- Green with pink/red lower borders (high energy precipitation)

#### Dense, Slow CME with Strong Southward Bz
**Conditions:**
- Kp: 6-7
- Bz: -15 to -20 nT
- Speed: 450-500 km/s
- Bt: 15-25 nT
- Density: 15-30 particles/cm³

**Result**: Probability 80-90%
- Bright, broad arcs
- Sustained activity over many hours
- Deep red coloration more likely (increased energy flux)

#### CIR (Co-rotating Interaction Region)
**Conditions:**
- Kp: 4-6 (fluctuating)
- Bz: Oscillating between -10 and +5 nT
- Speed: 500-650 km/s
- Bt: 8-15 nT
- Density: Variable, 5-15 particles/cm³

**Result**: Probability 40-70% (variable)
- Intermittent aurora activity
- Multiple activation/quiet periods
- More structured during southward Bz phases

---

## Compensatory Effects

### High Speed Can Compensate for Moderate Bz
- Speed: 700 km/s + Bz: -5 nT = Similar reconnection to Speed: 500 km/s + Bz: -7 nT
- Higher speeds enhance the geoeffectiveness of moderate southward Bz

### Strong Bt with Mixed Bz
- When Bt is very large (>20 nT) but Bz is near zero, brief southward turnings create intense but short-lived aurora
- The large Bt magnitude means any southward component becomes highly geoeffective

### Density Enhancement
- Very high density (>20 particles/cm³) increases magnetopause compression
- Creates additional dayside reconnection sites
- Can produce 10-20% higher aurora probability even with other parameters at moderate levels

---

## Aurora Color Physics

### Green Aurora (557.7 nm)
- **Altitude**: 100-250 km
- **Source**: Atomic oxygen
- **Energy**: 1-10 keV electrons
- **Most Common**: Appears in nearly all aurora events

### Red Aurora (630.0 nm)
- **Altitude**: 200-400 km (upper) or 80-100 km (lower rare red)
- **Source**: Atomic oxygen
- **Energy**: <1 keV (upper) or >10 keV (lower)
- **Occurrence**: Strong storms, high-latitude events

### Blue/Purple Aurora (427.8 nm)
- **Altitude**: 100 km and below
- **Source**: Molecular nitrogen (N₂⁺)
- **Energy**: >10 keV electrons
- **Occurrence**: Lower borders during very active aurora, sunlit aurora

### Pink/Magenta Aurora
- **Mixed emissions**: N₂⁺ blue + O red
- **Altitude**: 100-150 km
- **Occurrence**: High-energy precipitation events

---

## Special Conditions and Anomalies

### 1. Northward Bz Aurora (Theta Aurora)
**Conditions:**
- Kp: 2-4
- Bz: Strongly northward (>+5 nT) for >4 hours
- Low solar wind speed

**Characteristics:**
- Rare transpolar arc forming
- Occurs in polar cap (>75° latitude)
- Different mechanism (lobe reconnection)

### 2. STEVE (Strong Thermal Emission Velocity Enhancement)
**Conditions:**
- Kp: 4-6
- Following substorm recovery phase
- Specific magnetospheric configuration

**Characteristics:**
- Purple/mauve ribbon at 55-60° latitude
- Not technically aurora (different mechanism)
- Often accompanied by picket fence structures

### 3. Pulsating Aurora
**Conditions:**
- Recovery phase after substorm
- Kp: 3-5
- Moderate conditions

**Characteristics:**
- Patches turning on/off (0.5-20 second periods)
- Green/white diffuse patches
- Result of wave-particle interactions

### 4. Black Aurora
**Conditions:**
- During bright aurora activity
- Dynamic substorm phases

**Characteristics:**
- Dark regions within bright aurora
- Caused by upward currents blocking precipitation
- Indicates complex current systems

---

## Probability Calculation Formula

A simplified probability model based on parameter weighting:

```
P(Aurora) = Base_Kp × Bz_Factor × Speed_Factor × Bt_Factor × Density_Factor × Latitude_Factor
```

### Base Probability from Kp:
- Kp 0-2: 5%
- Kp 3: 15%
- Kp 4: 30%
- Kp 5: 50%
- Kp 6: 70%
- Kp 7: 85%
- Kp 8: 95%
- Kp 9: 98%

### Multipliers:

**Bz Factor:**
- Northward (>+5): 0.1
- Neutral (-5 to +5): 0.5
- -5 to -10: 1.2
- -10 to -15: 1.8
- -15 to -20: 2.5
- < -20: 3.0

**Speed Factor:**
- <400: 0.7
- 400-500: 1.0
- 500-600: 1.3
- 600-700: 1.6
- >700: 2.0

**Bt Factor:**
- <5: 0.8
- 5-10: 1.0
- 10-20: 1.2
- >20: 1.4

**Density Factor:**
- <5: 0.9
- 5-10: 1.0
- 10-20: 1.1
- >20: 1.2

**Latitude Factor (at 60° geomagnetic):**
- Multiply by latitude correction based on Kp

---

## Time Lag Considerations

### IMF to Aurora Response Time:
- **Solar wind monitoring point**: L1 (1.5 million km from Earth)
- **Transit time to Earth**: 30-60 minutes typically
- **Magnetospheric response**: 20-40 minutes after IMF arrival
- **Total lag**: ~45-90 minutes from L1 observation to aurora onset

### Substorm Development Timeline:
1. **Growth phase** (30-60 min): Energy loading, quiet
2. **Expansion phase** (10-30 min): Aurora brightens, spreads
3. **Recovery phase** (30-120 min): Aurora fades, pulsating patches

---

## Geographic Considerations

### Geomagnetic vs Geographic Latitude
Aurora probability must be calculated using **geomagnetic latitude**, not geographic.

**Key Locations (Geomagnetic Latitude):**
- Fairbanks, Alaska: 65°
- Reykjavik, Iceland: 64°
- Tromsø, Norway: 67°
- Yellowknife, Canada: 69°
- Southern New Zealand: -50°
- Tasmania: -53°
- Northern Scotland: 59°
- Minneapolis, USA: 55°

### Auroral Oval Expansion:
- **Quiet (Kp 0-1)**: 67-70° geomagnetic latitude
- **Minor storm (Kp 4)**: 60-63°
- **Moderate storm (Kp 6)**: 53-56°
- **Major storm (Kp 8)**: 45-48°
- **Extreme storm (Kp 9)**: Can reach 35-40° (rare)

---

## Seasonal and Diurnal Effects

### Seasonal Variation:
- **Equinoxes (March, September)**: 20-30% higher aurora frequency (Russell-McPherron effect)
- **Summer**: Continuous daylight at high latitudes prevents viewing (aurora still occurs)
- **Winter**: Best viewing due to darkness

### Diurnal Variation:
- **Midnight sector** (10 PM - 2 AM local): Maximum aurora activity
- **Evening sector** (6-10 PM): Growth phase, fainter aurora
- **Morning sector** (2-6 AM): Recovery phase, pulsating aurora
- **Daytime**: Aurora occurs but not visible (except in cusp)

### Russell-McPherron Effect:
During equinoxes, Earth's dipole tilt aligns favorably with solar wind, increasing southward Bz effectiveness by ~30%.

---

## Real-World Example Scenarios

### Example 1: Halloween Storm 2003
**Parameters:**
- Kp: 9
- Bz: -50 nT (extreme)
- Bt: 60 nT
- Speed: 2000 km/s (extreme CME)
- Density: 50+ particles/cm³

**Result:**
- Aurora visible to Texas, Mediterranean
- Bright red aurora dominant (extreme energy)
- Continuous activity for 12+ hours
- Multiple intense substorms

### Example 2: Moderate High-Speed Stream
**Parameters:**
- Kp: 5
- Bz: -8 nT (oscillating)
- Bt: 10 nT
- Speed: 650 km/s
- Density: 6 particles/cm³

**Result:**
- Aurora visible in northern Scotland, southern Alaska
- Green curtains with moderate movement
- 3-4 hours of activity
- Intermittent brightening

### Example 3: Dense CME, Slow Speed
**Parameters:**
- Kp: 6
- Bz: -18 nT
- Bt: 22 nT
- Speed: 480 km/s
- Density: 25 particles/cm³

**Result:**
- Aurora visible to northern England, southern Canada
- Bright, structured arcs with red upper borders
- 6-8 hours sustained activity
- Deep red coloration due to density

---

## Forecasting Limitations and Uncertainties

### High Uncertainty Factors:
1. **Bz prediction**: Extremely difficult to forecast >24 hours ahead
2. **Substorm timing**: Unpredictable within ±2 hours
3. **IMF rotation**: Can change from favorable to unfavorable in minutes
4. **Local effects**: Cloud cover, light pollution, ionospheric conductivity

### Reliability:
- **1-3 hour forecast**: 80-90% accuracy with real-time L1 data
- **24 hour forecast**: 60-70% accuracy
- **3-7 day forecast**: 30-50% accuracy (CME predictions only)

---

## Summary Table: Quick Reference

| Kp | Bz (nT) | Speed (km/s) | Probability | Latitude Reach | Aurora Type |
|---|---|---|---|---|---|
| 0-2 | Any | Any | 0-10% | >70° | None/Minimal |
| 3-4 | -3 to -7 | 400-500 | 10-30% | 65-70° | Faint arcs |
| 4-5 | -5 to -10 | 450-550 | 30-50% | 60-65° | Minor, green |
| 5-6 | -7 to -12 | 500-600 | 50-70% | 55-60° | Moderate, structured |
| 6-7 | -10 to -18 | 550-650 | 70-85% | 50-55° | Strong, multi-arc |
| 7-8 | -15 to -25 | 600-750 | 85-95% | 45-50° | Major, coronas |
| 8-9 | <-20 | >700 | 95-100% | <45° | Extreme, full-sky |

---

## Conclusion

Aurora probability and characteristics are the result of complex interactions between multiple space weather parameters. While the Kp index provides a general indicator, the Bz component is the single most critical factor, followed by solar wind speed. The combination of these parameters determines not only whether aurora will occur, but also their brightness, color, structure, and geographic extent.

For optimal aurora viewing, seek conditions with Kp ≥5, strongly southward Bz (<-10 nT), and fast solar wind (>500 km/s). The best displays occur when all parameters align during major geomagnetic storms with sustained southward IMF.

---

## References

Scientific basis derived from:
- NOAA Space Weather Prediction Center protocols
- Magnetospheric reconnection physics (Dungey, 1961)
- Auroral precipitation energy relationships
- Statistical studies from IMAGE, THEMIS, and ground-based magnetometer networks
- Empirical Kp-auroral oval relationship models (Feldstein, Starkov)

