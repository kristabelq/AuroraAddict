# Aurora Addict Intelligence Hub - Test Cases
## 100 Comprehensive Test Scenarios

### Test Categories:
1. **Arctic Locations (Latitude ≥65°)** - Tests 1-15
2. **Sub-Arctic Locations (60-65°)** - Tests 16-30
3. **High Mid-Latitudes (55-60°)** - Tests 31-45
4. **Mid-Latitudes (50-55°)** - Tests 46-60
5. **Lower Latitudes (<50°)** - Tests 61-75
6. **Edge Cases & Extreme Scenarios** - Tests 76-90
7. **Timezone & Peak Window Validation** - Tests 91-100

---

## Category 1: Arctic Locations (≥65°) - Peak Window: 11 PM - 3 AM

### Test 1: Optimal Arctic Conditions
- **Hunt Location**: Tromsø, Norway (69.65°N, 18.96°E)
- **Your Location**: Tromsø, Norway (same)
- **Expected Conditions**: Clear skies (10%), New Moon (5%), Dark (Yes), Bortle 2
- **Expected Travel**: 0 km, 0 min
- **Expected Peak Window**: 11 PM - 3 AM (Europe/Oslo)
- **Test Time**: 11:30 PM local
- **Expected Result**: PASS - Excellent verdict, arrival during peak, green arrival time

### Test 2: Arctic with 100% Cloud Cover
- **Hunt Location**: Longyearbyen, Svalbard (78.22°N, 15.65°E)
- **Your Location**: Same
- **Expected Conditions**: Overcast (100%), Quarter Moon (45%), Dark (Yes), Bortle 1
- **Expected Travel**: 0 km, 0 min
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 12:00 AM local
- **Expected Result**: PASS - Poor/Fair verdict due to 100% clouds, NOT "Fair" or better

### Test 3: Long Distance Arctic Hunt
- **Hunt Location**: Fairbanks, Alaska (64.84°N, 147.72°W)
- **Your Location**: Anchorage, Alaska (61.22°N, 149.90°W)
- **Expected Travel**: ~360 km, ~4.5 hours
- **Expected Peak Window**: 11 PM - 3 AM (America/Anchorage)
- **Test Time**: 8:00 PM local
- **Expected Result**: PASS - Can arrive by 12:30 AM, within peak window

### Test 4: Impossible Arctic Hunt
- **Hunt Location**: Rovaniemi, Finland (66.50°N, 25.72°E)
- **Your Location**: Helsinki, Finland (60.17°N, 24.94°E)
- **Expected Travel**: ~700 km, ~8.75 hours
- **Test Time**: 9:00 PM local
- **Expected Result**: PASS - Shows "Too far!" (>6 hours), red arrival time, Gate 3 = 0

### Test 5: Arctic High Light Pollution
- **Hunt Location**: Murmansk, Russia (68.97°N, 33.08°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (15%), New Moon, Dark (Yes), Bortle 8 (city)
- **Expected Peak Window**: 11 PM - 3 AM
- **Expected Result**: PASS - Verdict lowered by poor Bortle class

### Test 6: Arctic Full Moon
- **Hunt Location**: Kiruna, Sweden (67.86°N, 20.23°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), Full Moon (95%), Dark (Yes), Bortle 2
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 1:00 AM local
- **Expected Result**: PASS - Good conditions but penalized by full moon

### Test 7: Arctic Partly Cloudy
- **Hunt Location**: Akureyri, Iceland (65.68°N, 18.09°W)
- **Your Location**: Reykjavik, Iceland (64.13°N, 21.90°W)
- **Expected Conditions**: Partly cloudy (55%), Crescent Moon (20%), Dark (Yes), Bortle 3
- **Expected Travel**: ~390 km, ~4.9 hours
- **Expected Peak Window**: 11 PM - 3 AM (Atlantic/Reykjavik)
- **Test Time**: 6:00 PM local
- **Expected Result**: PASS - Good conditions, can arrive by 11 PM (peak start)

### Test 8: Arctic Short Distance
- **Hunt Location**: Abisko, Sweden (68.35°N, 18.82°E)
- **Your Location**: Kiruna, Sweden (67.86°N, 20.23°E)
- **Expected Travel**: ~70 km, ~0.9 hours
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 10:30 PM local
- **Expected Result**: PASS - Excellent, <1 hour travel bonus

### Test 9: Arctic Borderline (65° exactly)
- **Hunt Location**: Oulu, Finland (65.01°N, 25.47°E)
- **Your Location**: Same
- **Expected Peak Window**: 11 PM - 3 AM (should use Arctic window)
- **Expected Result**: PASS - Peak window 11 PM - 3 AM

### Test 10: Arctic Mostly Cloudy
- **Hunt Location**: Nuuk, Greenland (64.18°N, 51.69°W)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (75%), New Moon (5%), Dark (Yes), Bortle 1
- **Expected Peak Window**: 11 PM - 3 AM
- **Expected Result**: PASS - Poor verdict due to 75% clouds (only +5 points)

### Test 11: Arctic Late Arrival
- **Hunt Location**: Qaanaaq, Greenland (77.48°N, 69.36°W)
- **Your Location**: Upernavik, Greenland (72.79°N, 56.15°W)
- **Expected Travel**: ~600 km, ~7.5 hours
- **Test Time**: 8:00 PM local
- **Expected Result**: PASS - "Too far!" message (>6 hours)

### Test 12: Arctic Early Evening
- **Hunt Location**: Inuvik, Canada (68.36°N, 133.72°W)
- **Your Location**: Same
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 6:00 PM local
- **Expected Result**: PASS - Shows 5 hours until peak window

### Test 13: Arctic No Darkness
- **Hunt Location**: Barrow, Alaska (71.29°N, 156.79°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), New Moon (5%), Dark (NO - summer), Bortle 1
- **Expected Peak Window**: 11 PM - 3 AM
- **Expected Result**: PASS - Poor verdict due to no darkness (midnight sun)

### Test 14: Arctic Multiple Penalties
- **Hunt Location**: Norilsk, Russia (69.35°N, 88.19°E)
- **Your Location**: Same
- **Expected Conditions**: Overcast (90%), Full Moon (98%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 11 PM - 3 AM
- **Expected Result**: PASS - Very Poor verdict (multiple penalties)

### Test 15: Arctic Perfect Short Trip
- **Hunt Location**: Nellim, Finland (68.86°N, 28.15°E)
- **Your Location**: Ivalo, Finland (68.66°N, 27.55°E)
- **Expected Travel**: ~30 km, ~0.4 hours (~24 min)
- **Expected Conditions**: Clear (5%), New Moon (0%), Dark (Yes), Bortle 1
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 11:00 PM local
- **Expected Result**: PASS - Excellent verdict, <30 min travel (+30 points)

---

## Category 2: Sub-Arctic Locations (60-65°) - Peak Window: 10 PM - 2 AM

### Test 16: Optimal Sub-Arctic
- **Hunt Location**: Reykjavik, Iceland (64.13°N, 21.90°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (8%), New Moon (3%), Dark (Yes), Bortle 2
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 11:00 PM local
- **Expected Result**: PASS - Excellent verdict, peak window correctly 10 PM - 2 AM

### Test 17: Sub-Arctic Timezone Test
- **Hunt Location**: Whitehorse, Canada (60.72°N, 135.05°W)
- **Your Location**: Same
- **Expected Peak Window**: 10 PM - 2 AM (America/Whitehorse)
- **Expected Timezone Display**: GMT-07:00 or GMT-08:00 (depending on DST)
- **Expected Result**: PASS - Correct timezone shown

### Test 18: Sub-Arctic Cross-Border
- **Hunt Location**: Narvik, Norway (68.44°N, 17.43°E)
- **Your Location**: Stockholm, Sweden (59.33°N, 18.07°E)
- **Expected Travel**: ~1100 km, ~13.75 hours
- **Expected Peak Window**: 10 PM - 2 AM (but different from Narvik's Arctic window)
- **Expected Result**: FAIL - Travel >6 hours, "Too far!"

### Test 19: Sub-Arctic 80% Clouds
- **Hunt Location**: Shetland Islands, UK (60.15°N, 1.15°W)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (82%), Quarter Moon (40%), Dark (Yes), Bortle 3
- **Expected Peak Window**: 10 PM - 2 AM
- **Expected Result**: PASS - Poor verdict (80% clouds = 0 points)

### Test 20: Sub-Arctic Late Night
- **Hunt Location**: Anchorage, Alaska (61.22°N, 149.90°W)
- **Your Location**: Same
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 3:00 AM local
- **Expected Result**: PASS - Outside peak window, verdict reflects poor timing

### Test 21: Sub-Arctic Marginal Distance
- **Hunt Location**: Yellowknife, Canada (62.45°N, 114.35°W)
- **Your Location**: Fort Smith, Canada (60.00°N, 111.88°W)
- **Expected Travel**: ~270 km, ~3.4 hours
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 8:00 PM local
- **Expected Result**: PASS - Marginal timing (3.4 hrs), arrive 11:24 PM (within peak)

### Test 22: Sub-Arctic Very Clear
- **Hunt Location**: Lerwick, Shetland (60.15°N, 1.14°W)
- **Your Location**: Same
- **Expected Conditions**: Very clear (2%), New Moon (0%), Dark (Yes), Bortle 2
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 10:30 PM local
- **Expected Result**: PASS - Excellent verdict, optimal conditions

### Test 23: Sub-Arctic 60% Clouds
- **Hunt Location**: Tórshavn, Faroe Islands (62.01°N, 6.77°W)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (58%), Crescent Moon (25%), Dark (Yes), Bortle 3
- **Expected Peak Window**: 10 PM - 2 AM
- **Expected Result**: PASS - Good verdict (60% clouds = 5 points in new system)

### Test 24: Sub-Arctic Border (60° exactly)
- **Hunt Location**: Helsinki, Finland (60.17°N, 24.94°E)
- **Your Location**: Same
- **Expected Peak Window**: 10 PM - 2 AM (Sub-Arctic window)
- **Expected Result**: PASS - Correct peak window for 60-65° range

### Test 25: Sub-Arctic to Arctic Travel
- **Hunt Location**: Rovaniemi, Finland (66.50°N, 25.72°E)
- **Your Location**: Oulu, Finland (65.01°N, 25.47°E)
- **Expected Travel**: ~120 km, ~1.5 hours
- **Expected Peak Window Hunt**: 11 PM - 3 AM (Arctic for Rovaniemi)
- **Expected Peak Window Your**: N/A (uses hunt location)
- **Test Time**: 9:30 PM local
- **Expected Result**: PASS - Arrive 11 PM, correct Arctic peak window

### Test 26: Sub-Arctic 95% Clouds
- **Hunt Location**: Bergen, Norway (60.39°N, 5.32°E)
- **Your Location**: Same
- **Expected Conditions**: Overcast (95%), New Moon (5%), Dark (Yes), Bortle 4
- **Expected Peak Window**: 10 PM - 2 AM
- **Expected Result**: PASS - Poor/Very Poor verdict (95% clouds = 0 points)

### Test 27: Sub-Arctic Short Drive Perfect Time
- **Hunt Location**: Keflavik, Iceland (64.00°N, 22.56°W)
- **Your Location**: Reykjavik, Iceland (64.13°N, 21.90°W)
- **Expected Travel**: ~50 km, ~0.6 hours (~38 min)
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 10:00 PM local
- **Expected Result**: PASS - Excellent, arrive 10:38 PM (within peak)

### Test 28: Sub-Arctic Gibbous Moon
- **Hunt Location**: Nuuk, Greenland (64.18°N, 51.69°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (12%), Gibbous Moon (70%), Dark (Yes), Bortle 1
- **Expected Peak Window**: 10 PM - 2 AM
- **Expected Result**: PASS - Good conditions but moon penalty (70% = +10 points)

### Test 29: Sub-Arctic 2 Hour Drive
- **Hunt Location**: Utsjoki, Finland (69.91°N, 27.02°E)
- **Your Location**: Ivalo, Finland (68.66°N, 27.55°E)
- **Expected Travel**: ~140 km, ~1.75 hours
- **Expected Peak Window**: 11 PM - 3 AM (Arctic for Utsjoki)
- **Test Time**: 9:00 PM local
- **Expected Result**: PASS - Marginal travel time (+5 points), arrive 10:45 PM

### Test 30: Sub-Arctic Just Under 6 Hours
- **Hunt Location**: Tromsø, Norway (69.65°N, 18.96°E)
- **Your Location**: Bodø, Norway (67.28°N, 14.40°E)
- **Expected Travel**: ~440 km, ~5.5 hours
- **Test Time**: 8:00 PM local
- **Expected Result**: PASS - Just under limit, arrive 1:30 AM (within peak)

---

## Category 3: High Mid-Latitudes (55-60°) - Peak Window: 9 PM - 1 AM

### Test 31: Optimal High Mid-Latitude
- **Hunt Location**: Edinburgh, Scotland (55.95°N, 3.19°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), New Moon (5%), Dark (Yes), Bortle 3
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 10:00 PM local
- **Expected Result**: PASS - Excellent verdict, correct 9 PM - 1 AM window

### Test 32: Glasgow to Scottish Highlands
- **Hunt Location**: Durness, Scotland (58.57°N, 4.75°W)
- **Your Location**: Glasgow, Scotland (55.86°N, 4.25°W)
- **Expected Travel**: ~320 km, ~4 hours
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 7:00 PM local
- **Expected Result**: PASS - Can arrive 11 PM (within peak)

### Test 33: High Mid-Lat 100% Clouds
- **Hunt Location**: Inverness, Scotland (57.48°N, 4.22°W)
- **Your Location**: Same
- **Expected Conditions**: Overcast (100%), New Moon (2%), Dark (Yes), Bortle 3
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Poor verdict (100% clouds must fail)

### Test 34: Copenhagen Area
- **Hunt Location**: Copenhagen, Denmark (55.68°N, 12.57°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (15%), Quarter Moon (50%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 10:30 PM local
- **Expected Result**: PASS - Fair/Good verdict with light pollution penalty

### Test 35: Moscow Region
- **Hunt Location**: Moscow, Russia (55.75°N, 37.62°E)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (45%), Crescent Moon (30%), Dark (Yes), Bortle 9
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Verdict heavily penalized by Bortle 9

### Test 36: Southern Sweden
- **Hunt Location**: Jokkmokk, Sweden (66.61°N, 19.83°E)
- **Your Location**: Malmö, Sweden (55.60°N, 13.00°E)
- **Expected Travel**: ~1300 km, ~16.25 hours
- **Expected Result**: PASS - "Too far!" (>6 hours)

### Test 37: Borderline (55° exactly)
- **Hunt Location**: Newcastle, UK (55.00°N, 1.60°W)
- **Your Location**: Same
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Uses 55-60° window

### Test 38: High Mid-Lat Short Drive
- **Hunt Location**: Stirling, Scotland (56.12°N, 3.94°W)
- **Your Location**: Edinburgh, Scotland (55.95°N, 3.19°W)
- **Expected Travel**: ~50 km, ~0.6 hours
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 9:00 PM local
- **Expected Result**: PASS - Good timing, <1 hour travel

### Test 39: High Mid-Lat 70% Clouds
- **Hunt Location**: Dundee, Scotland (56.46°N, 2.97°W)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (70%), New Moon (5%), Dark (Yes), Bortle 4
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair/Poor verdict (70% clouds = +5 points)

### Test 40: Lithuania
- **Hunt Location**: Vilnius, Lithuania (54.69°N, 25.28°E)
- **Your Location**: Same
- **Expected Peak Window**: 8 PM - 12 AM (should be mid-latitude window <55°)
- **Expected Result**: PASS - Uses 50-55° window (NOT 55-60°)

### Test 41: Northern Ireland
- **Hunt Location**: Belfast, Northern Ireland (54.60°N, 5.93°W)
- **Your Location**: Same
- **Expected Peak Window**: 8 PM - 12 AM (50-55° range)
- **Expected Result**: PASS - Correct window for latitude

### Test 42: Latvia
- **Hunt Location**: Riga, Latvia (56.95°N, 24.11°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (20%), New Moon (8%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Good verdict with Bortle 5 penalty

### Test 43: Early Evening Arrival
- **Hunt Location**: Aberdeen, Scotland (57.15°N, 2.09°W)
- **Your Location**: Edinburgh, Scotland (55.95°N, 3.19°W)
- **Expected Travel**: ~190 km, ~2.4 hours
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 6:30 PM local
- **Expected Result**: PASS - Arrive 8:54 PM (just before peak start)

### Test 44: High Mid-Lat 85% Clouds
- **Hunt Location**: Orkney Islands, UK (59.00°N, 3.00°W)
- **Your Location**: Same
- **Expected Conditions**: Overcast (85%), New Moon (0%), Dark (Yes), Bortle 2
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Poor verdict (85% clouds = 0 points)

### Test 45: Estonia
- **Hunt Location**: Tallinn, Estonia (59.44°N, 24.75°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), Quarter Moon (45%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 11:00 PM local
- **Expected Result**: PASS - Good verdict, within peak window

---

## Category 4: Mid-Latitudes (50-55°) - Peak Window: 8 PM - 12 AM

### Test 46: Optimal Mid-Latitude
- **Hunt Location**: Calgary, Canada (51.05°N, 114.07°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (8%), New Moon (2%), Dark (Yes), Bortle 4
- **Expected Peak Window**: 8 PM - 12 AM
- **Test Time**: 9:00 PM local
- **Expected Result**: PASS - Excellent verdict, correct 8 PM - 12 AM window

### Test 47: London Area
- **Hunt Location**: London, UK (51.51°N, 0.13°W)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (50%), Quarter Moon (50%), Dark (Yes), Bortle 9
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Poor verdict (Bortle 9 city center)

### Test 48: Berlin
- **Hunt Location**: Berlin, Germany (52.52°N, 13.40°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (15%), Crescent Moon (20%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Fair verdict with Bortle 7 penalty

### Test 49: Prague
- **Hunt Location**: Prague, Czech Republic (50.08°N, 14.42°E)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (75%), New Moon (5%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Poor verdict (75% clouds + Bortle 6)

### Test 50: Amsterdam
- **Hunt Location**: Amsterdam, Netherlands (52.37°N, 4.89°E)
- **Your Location**: Same
- **Expected Conditions**: Overcast (92%), Full Moon (95%), Dark (Yes), Bortle 8
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Very Poor verdict (multiple penalties)

### Test 51: Vancouver to Whistler
- **Hunt Location**: Whistler, Canada (50.12°N, 122.95°W)
- **Your Location**: Vancouver, Canada (49.28°N, 123.12°W)
- **Expected Travel**: ~120 km, ~1.5 hours
- **Expected Peak Window**: 8 PM - 12 AM (Whistler is 50-55°)
- **Test Time**: 8:30 PM local
- **Expected Result**: PASS - Arrive 10 PM, within peak window

### Test 52: Warsaw
- **Hunt Location**: Warsaw, Poland (52.23°N, 21.01°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (12%), New Moon (3%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 8 PM - 12 AM
- **Test Time**: 9:30 PM local
- **Expected Result**: PASS - Good verdict with moderate light pollution

### Test 53: Brussels
- **Hunt Location**: Brussels, Belgium (50.85°N, 4.35°E)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (55%), Gibbous Moon (68%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Fair verdict (multiple moderate penalties)

### Test 54: Borderline Lower (50° exactly)
- **Hunt Location**: Mainz, Germany (50.00°N, 8.27°E)
- **Your Location**: Same
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Uses 50-55° window

### Test 55: Mid-Lat 100% Clouds
- **Hunt Location**: Cardiff, Wales (51.48°N, 3.18°W)
- **Your Location**: Same
- **Expected Conditions**: Overcast (100%), New Moon (5%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Poor verdict (100% clouds critical failure)

### Test 56: Winnipeg
- **Hunt Location**: Winnipeg, Canada (49.90°N, 97.14°W)
- **Your Location**: Same
- **Expected Peak Window**: 9 PM - 1 AM (should use <50° window)
- **Expected Result**: PASS - Correctly uses lower latitude window

### Test 57: Krakow
- **Hunt Location**: Krakow, Poland (50.06°N, 19.94°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (18%), Quarter Moon (40%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 8 PM - 12 AM
- **Test Time**: 10:00 PM local
- **Expected Result**: PASS - Good verdict, peak time

### Test 58: Frankfurt
- **Hunt Location**: Frankfurt, Germany (50.11°N, 8.68°E)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (78%), New Moon (7%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 8 PM - 12 AM
- **Expected Result**: PASS - Poor verdict (78% clouds = +5 points only)

### Test 59: Bristol to Scottish Border
- **Hunt Location**: Jedburgh, Scotland (55.47°N, 2.55°W)
- **Your Location**: Bristol, UK (51.45°N, 2.59°W)
- **Expected Travel**: ~450 km, ~5.6 hours
- **Expected Peak Window Hunt**: 9 PM - 1 AM (Jedburgh is 55-60°)
- **Test Time**: 7:00 PM local
- **Expected Result**: PASS - Arrive 12:36 AM (within Jedburgh's peak window)

### Test 60: Saskatoon
- **Hunt Location**: Saskatoon, Canada (52.13°N, 106.67°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (5%), New Moon (0%), Dark (Yes), Bortle 4
- **Expected Peak Window**: 8 PM - 12 AM
- **Test Time**: 9:00 PM local
- **Expected Result**: PASS - Excellent verdict, optimal conditions

---

## Category 5: Lower Latitudes (<50°) - Peak Window: 9 PM - 1 AM

### Test 61: Paris
- **Hunt Location**: Paris, France (48.86°N, 2.35°E)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (45%), Quarter Moon (50%), Dark (Yes), Bortle 8
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair verdict (city light pollution)

### Test 62: Northern US
- **Hunt Location**: Seattle, Washington (47.61°N, 122.33°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (12%), Crescent Moon (25%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 10:00 PM local
- **Expected Result**: PASS - Good verdict

### Test 63: Vienna
- **Hunt Location**: Vienna, Austria (48.21°N, 16.37°E)
- **Your Location**: Same
- **Expected Conditions**: Overcast (88%), New Moon (5%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Poor verdict (88% clouds = 0 points)

### Test 64: Munich
- **Hunt Location**: Munich, Germany (48.14°N, 11.58°E)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), Gibbous Moon (72%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair verdict (moon penalty)

### Test 65: Pacific Northwest Road Trip
- **Hunt Location**: Banff, Canada (51.18°N, 115.57°W)
- **Your Location**: Seattle, Washington (47.61°N, 122.33°W)
- **Expected Travel**: ~850 km, ~10.6 hours
- **Expected Result**: PASS - "Too far!" (>6 hours)

### Test 66: Switzerland
- **Hunt Location**: Zermatt, Switzerland (46.02°N, 7.75°E)
- **Your Location**: Zurich, Switzerland (47.37°N, 8.54°E)
- **Expected Travel**: ~220 km, ~2.75 hours
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 8:00 PM local
- **Expected Result**: PASS - Marginal travel time, arrive 10:45 PM

### Test 67: Milan
- **Hunt Location**: Milan, Italy (45.46°N, 9.19°E)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (70%), New Moon (8%), Dark (Yes), Bortle 8
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Poor verdict (70% clouds + Bortle 8)

### Test 68: Salt Lake City
- **Hunt Location**: Salt Lake City, Utah (40.76°N, 111.89°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (8%), New Moon (2%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 10:30 PM local
- **Expected Result**: PASS - Good verdict

### Test 69: Montreal
- **Hunt Location**: Montreal, Canada (45.50°N, 73.57°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (15%), Quarter Moon (45%), Dark (Yes), Bortle 7
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair verdict (Bortle 7 penalty)

### Test 70: Toronto
- **Hunt Location**: Toronto, Canada (43.65°N, 79.38°W)
- **Your Location**: Same
- **Expected Conditions**: Overcast (95%), New Moon (5%), Dark (Yes), Bortle 8
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Very Poor verdict (95% clouds + Bortle 8)

### Test 71: Minneapolis
- **Hunt Location**: Minneapolis, Minnesota (44.98°N, 93.27°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (10%), New Moon (3%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 11:00 PM local
- **Expected Result**: PASS - Good verdict, within peak

### Test 72: Portland
- **Hunt Location**: Portland, Oregon (45.52°N, 122.68°W)
- **Your Location**: Same
- **Expected Conditions**: Partly cloudy (58%), Crescent Moon (28%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair/Good verdict

### Test 73: Boston
- **Hunt Location**: Boston, Massachusetts (42.36°N, 71.06°W)
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (82%), Full Moon (97%), Dark (Yes), Bortle 8
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Very Poor verdict (multiple severe penalties)

### Test 74: Extreme Lower Latitude
- **Hunt Location**: Denver, Colorado (39.74°N, 104.99°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (5%), New Moon (0%), Dark (Yes), Bortle 5
- **Expected Peak Window**: 9 PM - 1 AM
- **Test Time**: 10:00 PM local
- **Expected Result**: PASS - Good verdict (rare aurora viewing location)

### Test 75: Bordeaux
- **Hunt Location**: Bordeaux, France (44.84°N, 0.58°W)
- **Your Location**: Same
- **Expected Conditions**: Clear (12%), Quarter Moon (48%), Dark (Yes), Bortle 6
- **Expected Peak Window**: 9 PM - 1 AM
- **Expected Result**: PASS - Fair/Good verdict

---

## Category 6: Edge Cases & Extreme Scenarios

### Test 76: Same Location, No Travel
- **Hunt Location**: Tromsø, Norway (69.65°N, 18.96°E)
- **Your Location**: Tromsø, Norway (same exact coordinates)
- **Expected Travel**: 0 km, 0 min
- **Expected Result**: PASS - Distance = 0, Time = 0, no travel penalty

### Test 77: Autocomplete Auto-Submit
- **Hunt Location**: Type "Trom" → Select "Tromsø, Norway" from dropdown
- **Expected Result**: PASS - Auto-submits, fetches data without clicking "Get"

### Test 78: Missing Hunt Location Data
- **Hunt Location**: Remote location with no weather data
- **Your Location**: Oslo, Norway
- **Expected Result**: PASS - Uses default values (15 points) for missing data

### Test 79: Exactly 6 Hour Travel
- **Hunt Location**: Kiruna, Sweden (67.86°N, 20.23°E)
- **Your Location**: Stockholm, Sweden (59.33°N, 18.07°E)
- **Expected Travel**: ~1200 km, ~15 hours
- **Expected Result**: FAIL - Should show "Too far!" but need to verify >6 hours

### Test 80: Cross International Date Line
- **Hunt Location**: Fairbanks, Alaska (64.84°N, 147.72°W)
- **Your Location**: Petropavlovsk, Russia (53.01°N, 158.65°E)
- **Expected Travel**: Very far
- **Expected Result**: PASS - Massive distance, "Too far!" message

### Test 81: Southern Hemisphere
- **Hunt Location**: Ushuaia, Argentina (54.80°S, 68.30°W)
- **Your Location**: Same
- **Expected Peak Window**: 9 PM - 1 AM (based on |latitude| = 54.8°)
- **Expected Result**: PASS - Uses absolute latitude for peak window calculation

### Test 82: Equator
- **Hunt Location**: Quito, Ecuador (0.18°S, 78.47°W)
- **Your Location**: Same
- **Expected Peak Window**: 9 PM - 1 AM (default for <50°)
- **Expected Result**: PASS - Uses default window, extremely poor Gate 1 conditions

### Test 83: 99% Cloud Cover
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Conditions**: Overcast (99%), New Moon (0%), Dark (Yes), Bortle 1
- **Expected Result**: PASS - Poor verdict (99% clouds = 0 points, threshold is 80%+)

### Test 84: 79% Cloud Cover (Threshold Test)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Conditions**: Mostly cloudy (79%), New Moon (0%), Dark (Yes), Bortle 1
- **Expected Result**: PASS - Fair verdict (79% = +5 points, just below 80% threshold)

### Test 85: 20% Cloud Cover (Threshold Test)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Conditions**: Clear (20%), New Moon (0%), Dark (Yes), Bortle 1
- **Expected Result**: PASS - Excellent verdict (20% = +25 points, just below 20% threshold)

### Test 86: 19% Cloud Cover (Threshold Test)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Conditions**: Clear (19%), New Moon (0%), Dark (Yes), Bortle 1
- **Expected Result**: PASS - Excellent verdict (19% = +30 points, below 20% threshold)

### Test 87: Exactly 30 Minutes Travel
- **Hunt Location**: Ivalo, Finland (68.66°N, 27.55°E)
- **Your Location**: Saariselkä, Finland (68.42°N, 27.40°E)
- **Expected Travel**: ~40 km, ~0.5 hours (30 min)
- **Expected Result**: PASS - Should get +25 points (<1 hour, not +30 for <30 min)

### Test 88: 29 Minutes Travel
- **Hunt Location**: Tromsø Airport (69.68°N, 18.92°E)
- **Your Location**: Tromsø Center (69.65°N, 18.96°E)
- **Expected Travel**: ~5 km, ~0.06 hours (~4 min)
- **Expected Result**: PASS - +30 points (<30 min travel)

### Test 89: Midnight Crossing
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 11:30 PM local
- **Expected Arrival**: 11:30 PM (0 travel)
- **Expected Result**: PASS - Peak time (hour 23, >= peakStart 23)

### Test 90: 2 AM Test (Peak End)
- **Hunt Location**: Reykjavik, Iceland
- **Your Location**: Same
- **Expected Peak Window**: 10 PM - 2 AM
- **Test Time**: 2:00 AM local
- **Expected Arrival**: 2:00 AM
- **Expected Result**: PASS - Should be within peak (hour 2, <= peakEnd 2)

---

## Category 7: Timezone & Peak Window Validation

### Test 91: GMT+00:00 (London)
- **Hunt Location**: London, UK (51.51°N, 0.13°W)
- **Your Location**: Same
- **Expected Timezone Display**: GMT+00:00 or GMT+01:00 (BST)
- **Expected Peak Window**: 8 PM - 12 AM (Europe/London)
- **Expected Result**: PASS - Correct GMT offset displayed

### Test 92: GMT-08:00 (Pacific Time)
- **Hunt Location**: Seattle, Washington (47.61°N, 122.33°W)
- **Your Location**: Same
- **Expected Timezone Display**: GMT-08:00 or GMT-07:00 (PDT)
- **Expected Peak Window**: 9 PM - 1 AM (America/Los_Angeles)
- **Expected Result**: PASS - Correct GMT offset

### Test 93: GMT+09:00 (Japan)
- **Hunt Location**: Sapporo, Japan (43.06°N, 141.35°E)
- **Your Location**: Same
- **Expected Timezone Display**: GMT+09:00
- **Expected Peak Window**: 9 PM - 1 AM (Asia/Tokyo)
- **Expected Result**: PASS - Correct GMT offset

### Test 94: GMT+01:00 (Central Europe)
- **Hunt Location**: Oslo, Norway (59.91°N, 10.75°E)
- **Your Location**: Same
- **Expected Timezone Display**: GMT+01:00 or GMT+02:00 (CEST)
- **Expected Peak Window**: 9 PM - 1 AM (Europe/Oslo)
- **Expected Result**: PASS - Correct GMT offset and timezone name

### Test 95: GMT-07:00 (Mountain Time)
- **Hunt Location**: Calgary, Canada (51.05°N, 114.07°W)
- **Your Location**: Same
- **Expected Timezone Display**: GMT-07:00 or GMT-06:00 (MDT)
- **Expected Peak Window**: 8 PM - 12 AM (America/Edmonton)
- **Expected Result**: PASS - Correct timezone

### Test 96: Peak Window Display Format
- **Hunt Location**: Tromsø, Norway (69.65°N, 18.96°E)
- **Your Location**: Same
- **Expected Peak Window Display**: "11:00 PM - 3:00 AM" or "23:00 - 03:00"
- **Expected Result**: PASS - Clear, readable format with hunt location timezone

### Test 97: Arrival Time Color Coding
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Helsinki, Finland (700 km away)
- **Expected Travel**: >6 hours
- **Expected Arrival Color**: Red (canArriveTonight = false)
- **Expected Result**: PASS - Red color for "Too far!"

### Test 98: Arrival Time Green (Peak)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 11:30 PM
- **Expected Arrival Color**: Green (isPeakTime = true)
- **Expected Result**: PASS - Green color during peak window

### Test 99: Arrival Time White (Non-Peak)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Peak Window**: 11 PM - 3 AM
- **Test Time**: 8:00 PM
- **Expected Arrival Color**: White (not peak, but can arrive)
- **Expected Result**: PASS - White color outside peak

### Test 100: Current Time vs Arrival Time Match (0 Travel)
- **Hunt Location**: Tromsø, Norway
- **Your Location**: Same
- **Expected Travel**: 0 km, 0 min
- **Test Time**: 10:15 PM
- **Expected Current Time**: 10:15 PM (GMT+02:00)
- **Expected Arrival Time**: 10:15 PM (GMT+02:00)
- **Expected Result**: PASS - Both times identical when travel = 0

---

## Test Execution Summary

### Critical Tests (Must Pass):
1. **Cloud Cover 100%** (Tests 2, 33, 55) - Must show Poor/Very Poor verdict
2. **Cloud Cover Thresholds** (Tests 83-86) - Verify 20%, 40%, 60%, 80% breakpoints
3. **Travel >6 Hours** (Tests 4, 11, 18, 79) - Must show "Too far!" and red arrival
4. **Peak Window Latitude** (Tests 1, 16, 31, 46, 61) - Correct windows per latitude range
5. **GMT Timezone Display** (Tests 91-95) - Correct timezone offset calculation
6. **Arrival Time Calculation** (Tests 87-88, 100) - Accurate travel time math
7. **Color Coding** (Tests 97-99) - Red for too far, green for peak, white otherwise
8. **Zero Travel** (Test 76, 100) - Same location handling

### Expected Pass Rate:
- **90%+** = Excellent (system working correctly)
- **75-90%** = Good (minor issues to fix)
- **<75%** = Needs Work (significant bugs present)

### Key Metrics to Verify:
1. Cloud cover scoring (0/5/15/25/30 points at correct thresholds)
2. Travel time scoring (<0.5hr: +30, <1hr: +25, <1.5hr: +15, <2.5hr: +5)
3. Peak windows (Arctic: 11PM-3AM, Sub-Arctic: 10PM-2AM, High-Mid: 9PM-1AM, Mid: 8PM-12AM, Lower: 9PM-1AM)
4. Timezone display accuracy
5. "Too far!" trigger at >6 hours
6. Verdict labels match score ranges (Excellent/Very Good/Good/Fair/Poor/Very Poor)
