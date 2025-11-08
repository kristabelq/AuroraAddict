# Aurora Addict Scoring System Analysis

## Current Problem

The current **additive system** allows poor conditions to still achieve "Fair" or "Good" verdicts because points from different factors simply add together. This leads to unrealistic scenarios like:

- **100% cloud cover** + **New Moon (30 pts)** + **Good Bortle (15 pts)** = 45 points = "Fair" verdict
  - **Reality**: You can't see aurora through 100% clouds, regardless of moon or light pollution!

## Comparison: Additive vs Multiplicative-Additive

### 1. Pure Additive System (Current)
```
Score = Factor1 + Factor2 + Factor3 + ...
```

**Pros**:
- ✅ Simple to understand
- ✅ Easy to calculate
- ✅ Smooth score distribution

**Cons**:
- ❌ **Critical failures don't block good verdicts**
- ❌ Can get "Good" verdict with 100% clouds
- ❌ Doesn't reflect reality (blocking conditions ignored)
- ❌ Compensates for deal-breakers with good stats

### 2. Multiplicative-Additive System (Recommended)
```
Score = BaseFactor × CriticalMultiplier1 × CriticalMultiplier2 × ...
```

**Pros**:
- ✅ **Critical factors can veto the entire verdict**
- ✅ Realistic: 100% clouds = automatic fail
- ✅ Reflects real-world aurora hunting (blocking conditions matter)
- ✅ Still allows nuanced scoring for non-critical factors

**Cons**:
- ⚠️ Slightly more complex calculation
- ⚠️ Need to carefully define what's "critical" vs "contributory"

---

## Recommended Approach: Hybrid System

### Design Philosophy

**Critical Factors** (Blocking):
- These are conditions that, if failed, make aurora viewing **impossible** or **highly impractical**
- They should act as **multipliers** (0.0 to 1.0)
- A multiplier of 0 means automatic failure regardless of other factors

**Contributory Factors** (Additive):
- These improve or worsen viewing quality but don't block entirely
- They add/subtract points within the valid range

---

## Gate-by-Gate Scoring Logic

### Gate 1: Space Weather (60% weight)
**Nature**: Purely additive - no single factor is "blocking"

**Factors**:
1. **Kp Index** (0-40 points)
   - Kp 0-2: 0 pts (No activity)
   - Kp 3: 10 pts (Weak)
   - Kp 4: 20 pts (Moderate)
   - Kp 5: 30 pts (Strong)
   - Kp 6+: 40 pts (Very strong)

2. **Solar Wind Speed** (0-30 points)
   - <350 km/s: 0 pts
   - 350-450 km/s: 10 pts
   - 450-550 km/s: 20 pts
   - >550 km/s: 30 pts

3. **Bz Component** (0-30 points)
   - Bz > 0 (North): 0 pts
   - -5 < Bz ≤ 0: 10 pts
   - -10 < Bz ≤ -5: 20 pts
   - Bz ≤ -10: 30 pts

**Maximum**: 100 points
**Logic**: Additive (no blocking factors)

---

### Gate 2: Viewing Conditions (30% weight)
**Nature**: **Hybrid** - Cloud cover and darkness are blocking

#### Critical Factors (Multiplicative):

**1. Cloud Cover Multiplier** (0.0 to 1.0)
```
if cloudCover >= 95:    multiplier = 0.0    // Complete block
if cloudCover >= 85:    multiplier = 0.2    // Severe penalty
if cloudCover >= 70:    multiplier = 0.5    // Major penalty
if cloudCover >= 50:    multiplier = 0.8    // Moderate penalty
if cloudCover < 50:     multiplier = 1.0    // No penalty
```

**Rationale**: You **cannot** see aurora through heavy clouds. This is a physical impossibility, not just "worse conditions."

**2. Darkness Multiplier** (0.0 or 1.0)
```
if isDarkness = false:  multiplier = 0.0    // Complete block
if isDarkness = true:   multiplier = 1.0    // No penalty
```

**Rationale**: Aurora is **invisible** in daylight (midnight sun). Binary condition.

#### Contributory Factors (Additive):

**3. Moon Phase** (0-30 points)
- 0-25% illumination: 30 pts
- 26-50%: 20 pts
- 51-75%: 10 pts
- 76-100%: 0 pts

**4. Light Pollution (Bortle)** (0-40 points)
- Bortle 1-3: 40 pts (Excellent dark site)
- Bortle 4-5: 25 pts (Good site)
- Bortle 6-7: 10 pts (Marginal site)
- Bortle 8-9: 0 pts (Too bright)

**Calculation**:
```typescript
// Step 1: Calculate base score from contributory factors
let baseScore = moonPoints + bortlePoints; // Max 70 points

// Step 2: Apply critical multipliers
let gate2Score = baseScore × cloudMultiplier × darknessMultiplier;

// Result: If cloudCover = 100%, cloudMultiplier = 0.0, final score = 0
```

**Maximum**: 70 points (before multipliers)
**Logic**: Hybrid - Critical factors can zero out the score

---

### Gate 3: Timing & Logistics (10% weight)
**Nature**: **Hybrid** - Travel time can be blocking

#### Critical Factor (Multiplicative):

**1. Travel Feasibility Multiplier** (0.0 or 1.0)
```
if travelTime > 6 hours:    multiplier = 0.0    // Cannot arrive tonight
if travelTime ≤ 6 hours:    multiplier = 1.0    // Can arrive
```

**Rationale**: If you can't physically arrive during the aurora window, distance is a **blocker**, not just "worse."

#### Contributory Factors (Additive):

**2. Travel Time** (0-30 points)
- <30 min: 30 pts
- <1 hr: 25 pts
- <1.5 hr: 15 pts
- <2.5 hr: 5 pts
- >2.5 hr: 0 pts

**3. Arrival Time vs Peak Window** (0-40 points)
- Arriving during peak window: 40 pts
- Arriving 1-2 hrs before/after peak: 30 pts
- Arriving 2-3 hrs before/after peak: 20 pts
- Arriving >3 hrs from peak: 0 pts

**4. Availability Bonus** (0-30 points)
- Activity within next 3 hours: 30 pts
- Activity within next 6 hours: 20 pts
- Activity within next 12 hours: 10 pts
- Activity >12 hours away: 0 pts

**Calculation**:
```typescript
// Step 1: Calculate base score from contributory factors
let baseScore = travelPoints + arrivalTimePoints + availabilityPoints; // Max 100 points

// Step 2: Apply critical multiplier
let gate3Score = baseScore × travelFeasibilityMultiplier;

// Result: If travelTime > 6 hours, multiplier = 0.0, final score = 0
```

**Maximum**: 100 points (before multiplier)
**Logic**: Hybrid - Travel feasibility can zero out the score

---

## Final Verdict Calculation

### Weighted Combination
```typescript
finalScore = (gate1Score × 0.60) + (gate2Score × 0.30) + (gate3Score × 0.10)
```

### Verdict Thresholds (Need Adjustment)

**Current Thresholds**:
- Excellent: 80-100
- Very Good: 70-80
- Good: 60-70
- Fair: 50-60
- Poor: 40-50
- Very Poor: 0-40

**Recommended New Thresholds** (with hybrid system):
```typescript
if (gate2Score === 0) return "Impossible"; // Can't see aurora (clouds/daylight)
if (gate3Score === 0 && travelTime > 6) return "Too Far"; // Can't arrive

// Normal verdicts
if (finalScore >= 85) return "Excellent";
if (finalScore >= 75) return "Very Good";
if (finalScore >= 65) return "Good";
if (finalScore >= 50) return "Fair";
if (finalScore >= 35) return "Poor";
return "Very Poor";
```

---

## Detailed Example Scenarios

### Scenario 1: 100% Clouds (Current vs New System)

**Conditions**:
- Cloud Cover: 100%
- Moon: New Moon (0%)
- Bortle: 2 (excellent)
- Darkness: Yes

**Current System (Additive)**:
```
Moon: 30 pts
Bortle: 25 pts
Clouds: 0 pts
Darkness: Assumed OK
Total: 55 pts → "Fair" verdict ❌ WRONG
```

**New System (Hybrid)**:
```
Base Score:
  Moon: 30 pts
  Bortle: 40 pts
  = 70 pts

Multipliers:
  Cloud (100%): 0.0
  Darkness: 1.0

Gate 2 Score: 70 × 0.0 × 1.0 = 0 pts
Final Verdict: "Impossible" ✅ CORRECT
```

---

### Scenario 2: Good Conditions (Both Systems)

**Conditions**:
- Cloud Cover: 15%
- Moon: Crescent (20%)
- Bortle: 3 (excellent)
- Darkness: Yes

**Current System**:
```
Moon: 30 pts
Bortle: 25 pts
Clouds: 30 pts
Total: 85 pts → "Excellent" ✅
```

**New System**:
```
Base Score:
  Moon: 30 pts
  Bortle: 40 pts
  = 70 pts

Multipliers:
  Cloud (15%): 1.0 (< 50%)
  Darkness: 1.0

Gate 2 Score: 70 × 1.0 × 1.0 = 70 pts → "Excellent" ✅
```

**Result**: Both systems agree when conditions are good

---

### Scenario 3: Moderate Clouds (70%)

**Conditions**:
- Cloud Cover: 70%
- Moon: New Moon (0%)
- Bortle: 2
- Darkness: Yes

**Current System**:
```
Moon: 30 pts
Bortle: 25 pts
Clouds: 5 pts (new thresholds)
Total: 60 pts → "Good" ❌ Questionable
```

**New System**:
```
Base Score:
  Moon: 30 pts
  Bortle: 40 pts
  = 70 pts

Multipliers:
  Cloud (70%): 0.5
  Darkness: 1.0

Gate 2 Score: 70 × 0.5 × 1.0 = 35 pts → "Poor" ✅ More realistic
```

---

### Scenario 4: Too Far Travel (Singapore to Tromsø)

**Conditions**:
- Distance: 9000+ km
- Travel Time: 112 hours
- Current Time: 9 PM
- Peak Window: 11 PM - 3 AM

**Current System**:
```
Travel Time: 0 pts (>2.5 hrs)
Arrival Time: 0 pts (can't arrive)
Availability: 20 pts
Total: 20 pts → "Very Poor" ⚠️ Still shows score
```

**New System**:
```
Base Score:
  Travel Time: 0 pts
  Arrival Time: 0 pts
  Availability: 20 pts
  = 20 pts

Multipliers:
  Travel Feasibility (>6 hrs): 0.0

Gate 3 Score: 20 × 0.0 = 0 pts
Final Verdict: "Too Far" ✅ Clear message
```

---

## Implementation Summary

### Gate 1: Space Weather
- **System**: Additive only
- **Max Points**: 100
- **Factors**: Kp Index (40), Solar Wind (30), Bz (30)
- **Blocking**: None

### Gate 2: Viewing Conditions
- **System**: Hybrid (multiplicative + additive)
- **Max Points**: 70 (before multipliers)
- **Critical Factors** (Multipliers):
  - Cloud Cover: 0.0-1.0 (95%+ = 0.0)
  - Darkness: 0.0 or 1.0 (no darkness = 0.0)
- **Contributory Factors** (Points):
  - Moon Phase: 0-30
  - Bortle Class: 0-40
- **Blocking**: Clouds ≥95% OR No darkness → Score = 0

### Gate 3: Timing & Logistics
- **System**: Hybrid (multiplicative + additive)
- **Max Points**: 100 (before multipliers)
- **Critical Factor** (Multiplier):
  - Travel Feasibility: 0.0 or 1.0 (>6 hrs = 0.0)
- **Contributory Factors** (Points):
  - Travel Time: 0-30
  - Arrival Timing: 0-40
  - Availability: 0-30
- **Blocking**: Travel >6 hours → Score = 0

---

## Recommendation

### ✅ Implement Hybrid System

**Why**:
1. **Realistic**: Blocking conditions (clouds, darkness, distance) properly veto viewing
2. **Clear Communication**: Special verdicts ("Impossible", "Too Far") are explicit
3. **Nuanced**: Non-blocking factors still provide gradation
4. **User-Friendly**: Makes logical sense to users ("Why go if I can't see it?")

**Changes Required**:
1. Add cloud cover multiplier logic to Gate 2
2. Add darkness multiplier logic to Gate 2
3. Add travel feasibility multiplier to Gate 3
4. Add special verdict checks before normal verdict calculation
5. Update verdict thresholds slightly
6. Update UI to show special verdicts prominently

**Expected Outcome**:
- 100% clouds → "Impossible" (not "Fair")
- No darkness → "Impossible" (not "Poor")
- >6 hour travel → "Too Far" (not "Very Poor")
- Good conditions → Same as before (both systems agree)

---

## Next Steps

1. Implement hybrid scoring system in `page.tsx`
2. Add special verdict handling ("Impossible", "Too Far")
3. Update UI to display blocking factors prominently
4. Adjust verdict thresholds if needed after testing
5. Update test cases to reflect new logic
