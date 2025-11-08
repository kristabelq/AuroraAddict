# Location Recommendations Feature - Testing Guide

**Status**: ✅ **FULLY IMPLEMENTED AND READY FOR TESTING**
**Date**: 2025-10-15
**Feature**: Cloud-aware Location Recommendations within 2-hour drive

---

## 📋 Feature Overview

This feature automatically recommends nearby locations (within 2-hour drive) where sky conditions are better than the user's current hunt location. It considers:
- Cloud cover at arrival time (accounting for drive time)
- Cloud clearing trends
- Drive distance and time
- Real-time weather forecasts

---

## 🎯 When Does It Activate?

The recommendations feature automatically triggers when:
1. ✅ User sets their **Your Location** (user's current position)
2. ✅ User sets their **Hunt Location** (where they plan to hunt)
3. ✅ Hunt Location has **>50% cloud cover**

**Code Location**: `src/app/(main)/intelligence/page.tsx:876-878`
```typescript
// Fetch location recommendations if clouds are significant (>50%)
if (weatherData.current.cloud_cover > 50 && yourLocationCoords) {
  fetchLocationRecommendations(yourLocationCoords.lat, yourLocationCoords.lon, weatherData);
}
```

---

## 🧪 How to Test

### Test Scenario 1: Cloudy Hunt Location
**Goal**: Trigger recommendations by selecting a cloudy hunt location

**Steps**:
1. Open http://localhost:3000
2. Navigate to Intelligence page
3. Set **Your Location**:
   - Example: "Fairbanks, Alaska" (64.8378°N, -147.7164°W)
4. Set **Hunt Location** to a known cloudy area:
   - Example: "Anchorage, Alaska" (61.2181°N, -149.9003°W)
   - Or search for any location and verify it has >50% cloud cover
5. Wait for data to load

**Expected Result**:
- If hunt location has >50% clouds AND there are better locations within 2 hours:
  - "Clear Skies Nearby!" card appears after Final Verdict
  - Shows up to 5 recommendations with:
    - Direction (e.g., "North - 60 km")
    - Drive time (e.g., "1h 15min drive")
    - Cloud cover at arrival (e.g., "25% clouds")
    - "Navigate →" button to Google Maps
    - Trend indicators (🌤️ clearing or ⚠️ worsening)

---

### Test Scenario 2: Clear Hunt Location
**Goal**: Verify recommendations don't appear when skies are already clear

**Steps**:
1. Set **Your Location**: "Fairbanks, Alaska"
2. Set **Hunt Location** to a clear area:
   - Example: A remote location with <50% clouds
3. Wait for data to load

**Expected Result**:
- NO recommendations card appears (cloud cover too low to warrant alternatives)

---

### Test Scenario 3: No User Location Set
**Goal**: Verify feature doesn't break when user location is missing

**Steps**:
1. Clear **Your Location** (leave it empty)
2. Set **Hunt Location**: Any location
3. Wait for data to load

**Expected Result**:
- NO recommendations appear (cannot calculate drive times without starting point)
- No errors in console

---

## 🔍 What to Check

### Visual Checks:
- [ ] Card appears in the correct position (after Final Verdict, before Light Pollution Map)
- [ ] Card has blue gradient background with 🚗 emoji
- [ ] Each recommendation shows:
  - [ ] Direction and distance (e.g., "Northeast - 90 km")
  - [ ] Drive time (e.g., "1h 45min")
  - [ ] Cloud cover at arrival (e.g., "30%")
  - [ ] Blue "Navigate →" button
  - [ ] Trend message if applicable
  - [ ] Before/after cloud comparison
- [ ] Star (⭐) appears on best recommendation (first one)
- [ ] Loading state shows "Finding clear skies..." while fetching

### Functional Checks:
- [ ] "Navigate →" button opens Google Maps with correct coordinates
- [ ] Recommendations are sorted by quality (best first)
- [ ] Only shows locations with significantly better conditions (at least 10% better)
- [ ] Drive times are reasonable (all within 2 hours)
- [ ] Cloud cover predictions match arrival times

### Console Checks:
- [ ] No errors in browser console
- [ ] API calls to:
  - [ ] Open-Meteo (weather forecasts)
  - [ ] OSRM (routing/drive times)
- [ ] Check Network tab for API responses

---

## 🧮 Algorithm Details

### Location Grid Generation
**Code**: Lines 655-674

Generates 32 candidate locations:
- **8 Directions**: N, NE, E, SE, S, SW, W, NW
- **4 Distances**: 30km, 60km, 90km, 120km
- **Total**: 8 × 4 = 32 locations

**Math**:
```javascript
const angleRad = (direction * Math.PI) / 180;
const latOffset = (distKm / 111) * Math.cos(angleRad);  // 1° lat ≈ 111km
const lonOffset = (distKm / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angleRad);
```

### Scoring Algorithm
**Code**: Lines 723-735

**Formula**:
```
score = (cloudCoverAtArrival × 2) + (driveTimeMinutes × 0.1) + trendModifier
```

**Components**:
- **Cloud cover** (×2 weight): Most important - lower is better
- **Drive time** (×0.1 weight): Shorter drives preferred
- **Trend bonus/penalty**:
  - Clearing trend: -20 points (bonus)
  - Worsening trend: +20 points (penalty)
  - Stable: 0 points

**Lower score = Better recommendation**

### Filtering
**Code**: Lines 748-751

Only shows recommendations where:
```
cloudCoverAtArrival < currentCloudCover - 10
```
(At least 10% improvement required)

---

## 🌐 API Details

### Open-Meteo Weather API
**Endpoint**:
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=cloud_cover
  &hourly=cloud_cover
  &forecast_hours=8
  &timezone=auto
```

**Data Used**:
- `current.cloud_cover`: Current cloud %
- `hourly.cloud_cover[N]`: Cloud % at future hours
- Used to predict conditions at arrival time

**Rate Limits**: None for reasonable use
**Cost**: Free

### OSRM Routing API
**Endpoint**:
```
GET https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}
  ?overview=false
```

**Data Used**:
- `routes[0].duration`: Drive time in seconds
- Converted to minutes for display

**Rate Limits**: Fair use policy
**Cost**: Free

---

## 📊 Example Test Data

### Good Test Locations (Cloudy):
1. **Anchorage, Alaska**: Often cloudy (61.2181°N, -149.9003°W)
2. **Seattle, Washington**: Frequently overcast (47.6062°N, -122.3321°W)
3. **Reykjavik, Iceland**: Variable weather (64.1466°N, -21.9426°W)

### User Locations (For "Your Location"):
1. **Fairbanks, Alaska**: 64.8378°N, -147.7164°W
2. **Juneau, Alaska**: 58.3019°N, -134.4197°W
3. **Yellowknife, Canada**: 62.4540°N, -114.3718°W

### Expected Recommendations:
When testing Anchorage (cloudy) from Fairbanks:
- Should suggest locations north of Anchorage (clearer interior Alaska)
- Drive times: 30min - 2hr
- Cloud improvements: 20-40% reduction

---

## 🐛 Known Limitations

1. **OSRM Coverage**:
   - Works best in North America and Europe
   - May fail for remote locations without road data
   - Failures are gracefully handled (recommendation skipped)

2. **Grid Granularity**:
   - Only checks 32 points (not exhaustive)
   - May miss optimal locations between grid points
   - Trade-off for performance

3. **Weather Forecast Accuracy**:
   - Depends on Open-Meteo forecast quality
   - 8-hour forecasts generally reliable
   - Can vary by region

4. **Drive Time Assumptions**:
   - Assumes normal driving speeds
   - Doesn't account for road conditions, weather, or traffic
   - Uses straight-line routes when no roads exist

---

## ✅ Completion Checklist

- [x] State variables created (lines 88-100)
- [x] Grid generation algorithm implemented (lines 655-674)
- [x] Weather API integration (lines 676-694)
- [x] OSRM routing API integration (lines 696-709)
- [x] Scoring algorithm (lines 723-735)
- [x] Filtering logic (lines 748-751)
- [x] Trigger condition (lines 876-878)
- [x] UI component (lines 2710-2785)
- [ ] **Manual testing with real locations**
- [ ] **Verification of API responses**
- [ ] **User acceptance testing**

---

## 🚀 Next Steps

1. **Immediate Testing** (Required):
   - Test with cloudy hunt location ✅
   - Test with clear hunt location ✅
   - Test with no user location ✅
   - Verify API calls in Network tab
   - Check console for errors

2. **Optional Enhancements** (Future):
   - Add location names via reverse geocoding
   - Show recommendations on an embedded map
   - Add "Set as Hunt Location" button
   - Cache recommendations for 15 minutes
   - Add weather radar integration
   - Show precipitation forecasts

3. **Documentation**:
   - Update main README with feature description
   - Add to user guide
   - Create video tutorial

---

## 📝 Testing Log Template

Use this template when testing:

```
Date: ______
Tester: ______

Test 1: Cloudy Location
- Your Location: _______________
- Hunt Location: _______________
- Cloud Cover: ____%
- Recommendations Shown: ☐ Yes ☐ No
- Number of Recommendations: ____
- Drive Times: ________________
- Issues Found: ________________

Test 2: Clear Location
- Your Location: _______________
- Hunt Location: _______________
- Cloud Cover: ____%
- Recommendations Shown: ☐ Yes ☐ No (expected: No)
- Issues Found: ________________

Test 3: No User Location
- Hunt Location: _______________
- Recommendations Shown: ☐ Yes ☐ No (expected: No)
- Console Errors: ☐ Yes ☐ No
- Issues Found: ________________

Additional Notes:
_________________________________
_________________________________
```

---

## 🎉 Success Criteria

The feature is **working correctly** if:
- ✅ Recommendations appear when hunt location is cloudy (>50%)
- ✅ Recommendations show better conditions (at least 10% improvement)
- ✅ All drive times are ≤ 2 hours
- ✅ Navigate buttons open correct Google Maps links
- ✅ No console errors
- ✅ Loading state shows while fetching
- ✅ Feature doesn't break when user location is missing

---

**Ready to test! 🚗☁️→🌙**

Visit http://localhost:3000 and set up a cloudy hunt location to see recommendations in action!
