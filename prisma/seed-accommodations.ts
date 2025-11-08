import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive accommodation data with coordinates
const accommodations = [
  // ============================================
  // FINLAND - Rovaniemi Region
  // ============================================
  {
    businessName: "Arctic SnowHotel & Glass Igloos",
    country: "Finland",
    city: "Rovaniemi",
    latitude: 66.5039,
    longitude: 25.7294,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticsnowhotel.fi/",
    businessDescription: "Glass igloos with 360° dome and Aurora alarm system. Located in the heart of Finnish Lapland near Rovaniemi.",
    roomTypes: [
      {
        name: "360° Glass Igloo",
        description: "Panoramic glass dome with aurora alarm system and heated glass roof to prevent snow buildup",
        capacity: 2,
        amenities: ["360° Glass Dome", "Aurora Alarm", "Heated Glass Roof", "Private Bathroom", "WiFi"],
      }
    ]
  },
  {
    businessName: "Apukka Resort",
    country: "Finland",
    city: "Rovaniemi",
    latitude: 66.5428,
    longitude: 25.8467,
    businessServices: ["accommodation"],
    businessWebsite: "https://apukkaresort.fi/",
    businessDescription: "Premium Aurora accommodation with multiple glass igloo variants and Aurora Cabins. Aurora 360 Cabins, Komsio and Kammi Glass Igloo Suites available.",
    roomTypes: [
      { name: "Aurora Cabin Standard", capacity: 2, amenities: ["Panoramic Windows", "Private Sauna", "Heated Floors"] },
      { name: "Aurora Cabin Queen", capacity: 2, amenities: ["Large Panoramic Windows", "Private Sauna", "Luxury Interior"] },
      { name: "Aurora Cabin King", capacity: 2, amenities: ["Extra Large Windows", "Premium Sauna", "Fireplace"] },
      { name: "Aurora Cabin Family", capacity: 4, amenities: ["Family Suite", "Private Sauna", "Kitchenette"] },
      { name: "Aurora 360 Cabin", capacity: 2, amenities: ["360° Glass", "Heated Roof", "Aurora Alarm"] },
      { name: "Komsio Glass Igloo Suite", capacity: 2, amenities: ["Glass Igloo", "Premium Suite", "Hot Tub"] },
      { name: "Kammi Glass Igloo Suite", capacity: 2, amenities: ["Traditional Sámi Design", "Glass Roof", "Fireplace"] },
    ]
  },
  {
    businessName: "Glass Resort",
    country: "Finland",
    city: "Rovaniemi",
    latitude: 66.5194,
    longitude: 25.7450,
    businessServices: ["accommodation"],
    businessWebsite: "https://glassresort.fi/",
    businessDescription: "Modern glass igloos designed for optimal aurora viewing near Rovaniemi.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Heated Glass Roof", "Private Bathroom", "Aurora Viewing Bed"] },
    ]
  },
  {
    businessName: "Santa's Igloos Arctic Circle",
    country: "Finland",
    city: "Rovaniemi",
    latitude: 66.5431,
    longitude: 25.8473,
    businessServices: ["accommodation"],
    businessWebsite: "https://santashotelsantaclaus.fi/santas-igloos/",
    businessDescription: "Glass igloos located right on the Arctic Circle with thermal glass roofs and direct access to Santa Claus Village.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Thermal Glass Roof", "Arctic Circle Location", "Private Facilities"] },
    ]
  },
  {
    businessName: "Arctic TreeHouse Hotel",
    country: "Finland",
    city: "Rovaniemi",
    latitude: 66.5845,
    longitude: 25.8206,
    businessServices: ["accommodation"],
    businessWebsite: "https://arctictreehousehotel.com/",
    businessDescription: "Unique treehouse suites with panoramic windows for aurora viewing, elevated in the forest canopy.",
    roomTypes: [
      { name: "TreeHouse Suite", capacity: 2, amenities: ["Panoramic Windows", "Elevated Design", "Luxury Interior", "Floor Heating"] },
    ]
  },

  // ============================================
  // FINLAND - Ivalo-Saariselkä-Inari Corridor
  // ============================================
  {
    businessName: "Kakslauttanen Arctic Resort",
    country: "Finland",
    city: "Saariselkä",
    latitude: 68.4132,
    longitude: 27.4044,
    businessServices: ["accommodation"],
    businessWebsite: "https://kakslauttanen.fi/",
    businessDescription: "The original glass igloo resort with world-famous glass igloos that started the aurora accommodation trend. Can sleep 2-4 people.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Original Glass Igloo", "Heated Glass", "Private Toilet", "Shared Shower"] },
      { name: "Kelo-Glass Igloo", capacity: 4, amenities: ["Log Cabin + Glass Bedroom", "Full Facilities", "Kitchenette", "Fireplace"] },
    ]
  },
  {
    businessName: "Aurora Village Ivalo",
    country: "Finland",
    city: "Ivalo",
    latitude: 68.6597,
    longitude: 27.5514,
    businessServices: ["accommodation"],
    businessWebsite: "https://auroravillage.fi/",
    businessDescription: "28m² Glass Roof Aurora Cabins with 2-bedroom suites and luxury two-floor suites available.",
    roomTypes: [
      { name: "Glass Roof Aurora Cabin", capacity: 2, amenities: ["28m² Space", "Glass Ceiling", "Private Sauna", "Kitchenette"] },
      { name: "Two-Bedroom Suite", capacity: 4, amenities: ["Two Bedrooms", "Glass Roof", "Full Kitchen", "Large Sauna"] },
      { name: "Luxury Two-Floor Suite", capacity: 4, amenities: ["Two Floors", "Premium Furnishing", "Large Glass Roof", "Hot Tub"] },
    ]
  },
  {
    businessName: "Wilderness Hotel Inari",
    country: "Finland",
    city: "Inari",
    latitude: 68.9069,
    longitude: 27.0258,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildernesshotel.fi/hotels/inari/",
    businessDescription: "Aurora Cabins with laser-heated glass roofs on the shore of Lake Inari, one of Finland's largest lakes.",
    roomTypes: [
      { name: "Aurora Cabin", capacity: 2, amenities: ["Laser-Heated Glass Roof", "Lake Inari Shore", "Private Sauna", "Lakefront Views"] },
    ]
  },
  {
    businessName: "Wilderness Hotel Muotka",
    country: "Finland",
    city: "Saariselkä",
    latitude: 68.3883,
    longitude: 27.3589,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildernesshotel.fi/hotels/muotka/",
    businessDescription: "Aurora Cabins with private sauna or fireplace in pristine wilderness setting.",
    roomTypes: [
      { name: "Aurora Cabin with Sauna", capacity: 2, amenities: ["Glass Roof", "Private Sauna", "Wilderness Location"] },
      { name: "Aurora Cabin with Fireplace", capacity: 2, amenities: ["Glass Roof", "Fireplace", "Cozy Interior"] },
    ]
  },
  {
    businessName: "Wilderness Hotel Nellim",
    country: "Finland",
    city: "Nellim",
    latitude: 68.8597,
    longitude: 28.1939,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildernesshotel.fi/hotels/nellim/",
    businessDescription: "Aurora Cabins on the shores of Lake Inari near the Russian border.",
    roomTypes: [
      { name: "Aurora Cabin", capacity: 2, amenities: ["Glass Roof", "Lake Inari Shore", "Remote Location", "Private Sauna"] },
    ]
  },
  {
    businessName: "Wilderness Hotel Nangu",
    country: "Finland",
    city: "Inari",
    latitude: 68.9156,
    longitude: 27.0311,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildernesshotel.fi/hotels/nangu/",
    businessDescription: "Unique Aurora Huts on Lake Inari that can be moved onto the frozen lake in winter for unobstructed aurora viewing.",
    roomTypes: [
      { name: "Aurora Hut", capacity: 2, amenities: ["Movable to Frozen Lake", "Glass Roof", "Unique Experience", "Private Facilities"] },
    ]
  },
  {
    businessName: "Northern Lights Village Saariselkä",
    country: "Finland",
    city: "Saariselkä",
    latitude: 68.4189,
    longitude: 27.3506,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.northernlightsvillage.com/",
    businessDescription: "Dedicated glass-roofed Aurora Cabin village in the heart of Saariselkä fell region.",
    roomTypes: [
      { name: "Aurora Cabin", capacity: 2, amenities: ["Glass Roof", "Village Setting", "Restaurant Access", "Aurora Activities"] },
    ]
  },
  {
    businessName: "Star Arctic Hotel",
    country: "Finland",
    city: "Saariselkä",
    latitude: 68.4169,
    longitude: 27.4053,
    businessServices: ["accommodation"],
    businessWebsite: "https://stararctichotel.com/",
    businessDescription: "Contemporary design hotel with rooms featuring large sky-view windows for aurora watching.",
    roomTypes: [
      { name: "Sky View Room", capacity: 2, amenities: ["Large Sky Windows", "Modern Design", "Hotel Amenities", "Restaurant"] },
    ]
  },

  // ============================================
  // FINLAND - Levi Region (Kittilä area)
  // ============================================
  {
    businessName: "Northern Lights Village Levi",
    country: "Finland",
    city: "Levi",
    latitude: 67.8006,
    longitude: 24.8094,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.northernlightsvillage.com/levi",
    businessDescription: "Glass-roofed Aurora accommodation village, 17 km from Levi ski resort.",
    roomTypes: [
      { name: "Aurora Cabin", capacity: 2, amenities: ["Glass Roof", "Near Levi Resort", "Heated Floors", "Private Facilities"] },
    ]
  },
  {
    businessName: "Northern Lights Ranch",
    country: "Finland",
    city: "Levi",
    latitude: 67.7892,
    longitude: 24.7867,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.northernlightsranch.com/",
    businessDescription: "6 distinct Sky View Cabins with heated glass roofs, floor-to-ceiling windows. Some cabins have private hot tubs.",
    roomTypes: [
      { name: "Sky View Cabin", capacity: 2, amenities: ["Heated Glass Roof", "Floor-to-Ceiling Windows", "Luxury Interior"] },
      { name: "Sky View Cabin with Hot Tub", capacity: 2, amenities: ["Heated Glass Roof", "Private Hot Tub", "Premium Features"] },
    ]
  },
  {
    businessName: "Levin Iglut Golden Crown",
    country: "Finland",
    city: "Levi",
    latitude: 67.8103,
    longitude: 24.8164,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.leviniglut.net/",
    businessDescription: "Glass igloos on hillslope at 340m elevation with outdoor jacuzzi and panoramic views over Levi.",
    roomTypes: [
      { name: "Glass Igloo with Jacuzzi", capacity: 2, amenities: ["Hillside 340m", "Outdoor Jacuzzi", "Panoramic Views", "Heated Glass"] },
    ]
  },
  {
    businessName: "OloResort",
    country: "Finland",
    city: "Levi",
    latitude: 67.7956,
    longitude: 24.7944,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.oloresort.fi/",
    businessDescription: "Private glass igloo suites near Levi with modern amenities.",
    roomTypes: [
      { name: "Glass Igloo Suite", capacity: 2, amenities: ["Private Suite", "Modern Design", "Heated Glass", "Full Facilities"] },
    ]
  },
  {
    businessName: "Aurora Pyramid Glass Igloo",
    country: "Finland",
    city: "Levi",
    latitude: 67.7889,
    longitude: 24.7822,
    businessServices: ["accommodation"],
    businessWebsite: "https://aurorapyramid.com/",
    businessDescription: "Brand new pyramid-shaped glass structures offering unique geometric aurora viewing experience.",
    roomTypes: [
      { name: "Pyramid Glass Igloo", capacity: 2, amenities: ["Pyramid Shape", "Unique Design", "Full Glass Walls", "Modern Interior"] },
    ]
  },

  // ============================================
  // FINLAND - Other Locations
  // ============================================
  {
    businessName: "Pyhä Igloos",
    country: "Finland",
    city: "Pyhätunturi",
    latitude: 67.0028,
    longitude: 26.9481,
    businessServices: ["accommodation"],
    businessWebsite: "https://pyhaigloos.fi/",
    businessDescription: "Glass igloos above the Arctic Circle, 120 km from Rovaniemi in Pyhä-Luosto National Park.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["National Park", "Heated Glass", "Fell Views", "Private Facilities"] },
    ]
  },
  {
    businessName: "Arctic Fox Igloos",
    country: "Finland",
    city: "Ranua",
    latitude: 65.9261,
    longitude: 26.4833,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticfoxigloos.fi/",
    businessDescription: "Igloo-style cabins with sauna, 85 km from Rovaniemi near Ranua Wildlife Park.",
    roomTypes: [
      { name: "Igloo Cabin with Sauna", capacity: 2, amenities: ["Igloo Design", "Private Sauna", "Near Wildlife Park", "Glass Ceiling"] },
    ]
  },
  {
    businessName: "Arctic Igloos Ranua",
    country: "Finland",
    city: "Ranua",
    latitude: 65.9344,
    longitude: 26.4906,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticigloosranua.fi/",
    businessDescription: "Glass igloos on Lake Ranuanjärvi shore with private sauna in each unit.",
    roomTypes: [
      { name: "Glass Igloo with Sauna", capacity: 2, amenities: ["Lakefront", "Private Sauna", "Heated Glass", "Lake Views"] },
    ]
  },
  {
    businessName: "Iisakkii Glass Village",
    country: "Finland",
    city: "Ruka",
    latitude: 66.1694,
    longitude: 29.1361,
    businessServices: ["accommodation"],
    businessWebsite: "https://iisakki.fi/",
    businessDescription: "Glass villas on Lake Rukajärvi shore near Ruka ski resort.",
    roomTypes: [
      { name: "Glass Villa", capacity: 4, amenities: ["Lakefront", "Full Villa", "Glass Walls", "Kitchen", "Sauna"] },
    ]
  },
  {
    businessName: "Seaside Glass Villas",
    country: "Finland",
    city: "Kemi",
    latitude: 65.7369,
    longitude: 24.5631,
    businessServices: ["accommodation"],
    businessWebsite: "https://seasideglassvillas.fi/",
    businessDescription: "Unique glass villas by the Baltic Sea coast, offering aurora viewing from coastal location.",
    roomTypes: [
      { name: "Glass Villa", capacity: 4, amenities: ["Baltic Sea", "Coastal Views", "Full Villa", "Modern Amenities"] },
    ]
  },
  {
    businessName: "Vasara Reindeer Ranch",
    country: "Finland",
    city: "Kilpisjärvi",
    latitude: 69.0456,
    longitude: 20.7886,
    businessServices: ["accommodation"],
    businessWebsite: "https://vasara.fi/",
    businessDescription: "Glass igloos at authentic Sámi reindeer ranch in far northwestern Finland near Norwegian border.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Reindeer Ranch", "Sámi Culture", "Remote Location", "Mountain Views"] },
    ]
  },
  {
    businessName: "Arctic Land Adventure Glass Igloos",
    country: "Finland",
    city: "Kilpisjärvi",
    latitude: 69.0500,
    longitude: 20.8000,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticlandadventure.fi/",
    businessDescription: "4 spacious glass igloos in Kilpisjärvi, Finland's northernmost village.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Spacious", "Northernmost Finland", "Mountain Views", "Private Facilities"] },
    ]
  },
  {
    businessName: "Torassieppi Eco Reindeer Resort",
    country: "Finland",
    city: "Muonio",
    latitude: 67.9522,
    longitude: 23.6772,
    businessServices: ["accommodation"],
    businessWebsite: "https://torassieppi.fi/",
    businessDescription: "Aurora Domes on Lake Torassieppi, eco-friendly reindeer resort.",
    roomTypes: [
      { name: "Aurora Dome", capacity: 2, amenities: ["Lake Torassieppi", "Eco-Resort", "Reindeer Farm", "Glass Dome"] },
    ]
  },
  {
    businessName: "Kuuru Lakeside",
    country: "Finland",
    city: "Salla",
    latitude: 66.8325,
    longitude: 28.6667,
    businessServices: ["accommodation"],
    businessWebsite: "https://kuuru.fi/",
    businessDescription: "Glass-fronted ecological suites on Lake Keselmäjärvi shore in Salla wilderness.",
    roomTypes: [
      { name: "Glass-fronted Suite", capacity: 2, amenities: ["Lake Keselmäjärvi", "Ecological", "Wilderness", "Modern Design"] },
    ]
  },
  {
    businessName: "Arctic Giant Hotel",
    country: "Finland",
    city: "Paltamo",
    latitude: 64.4061,
    longitude: 27.8353,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticgianthotel.fi/",
    businessDescription: "Aurora viewing accommodation in northern Lakeland region of Kainuu.",
    roomTypes: [
      { name: "Aurora Room", capacity: 2, amenities: ["Lakeland Location", "Aurora Windows", "Southern Option", "Hotel Amenities"] },
    ]
  },

  // ============================================
  // NORWAY
  // ============================================
  {
    businessName: "Lyngen North",
    country: "Norway",
    city: "Lyngen",
    latitude: 69.5781,
    longitude: 20.2214,
    businessServices: ["accommodation"],
    businessWebsite: "https://lyngen-north.com/",
    businessDescription: "180° and 360° glass pods with private fjord/seaview suites near Tromsø.",
    roomTypes: [
      { name: "180° Glass Pod", capacity: 2, amenities: ["180° Glass View", "Fjord Views", "Heated Glass", "Private Facilities"] },
      { name: "360° Glass Pod", capacity: 2, amenities: ["360° Panoramic", "Sea Views", "Premium Design", "Luxury Interior"] },
      { name: "Fjord View Suite", capacity: 2, amenities: ["Panoramic Windows", "Fjord Location", "Suite Amenities", "Private Terrace"] },
    ]
  },
  {
    businessName: "Wilderness Camp Tamok",
    country: "Norway",
    city: "Tamok Valley",
    latitude: 69.2833,
    longitude: 19.4167,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildcamp.no/",
    businessDescription: "Glass accommodations in pristine Norwegian wilderness valley.",
    roomTypes: [
      { name: "Wilderness Glass Cabin", capacity: 2, amenities: ["Wilderness Location", "Glass Walls", "Remote", "Nature Experience"] },
    ]
  },
  {
    businessName: "Snowhotel Kirkenes",
    country: "Norway",
    city: "Kirkenes",
    latitude: 69.7267,
    longitude: 30.0450,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.snowhotel.no/",
    businessDescription: "20 ice rooms plus warm Northern Lights cabins near Russian border in Norway's far northeast.",
    roomTypes: [
      { name: "Ice Room", capacity: 2, amenities: ["Ice Hotel", "Unique Experience", "Sleeping Bags", "Shared Facilities"] },
      { name: "Northern Lights Cabin", capacity: 2, amenities: ["Warm Cabin", "Aurora Windows", "Heated", "Private Facilities"] },
    ]
  },
  {
    businessName: "Manshausen",
    country: "Norway",
    city: "Nordland",
    latitude: 68.1333,
    longitude: 15.5500,
    businessServices: ["accommodation"],
    businessWebsite: "https://manshausen.no/",
    businessDescription: "7 sea cabins with large glass windows overlooking sea and mountains on private island.",
    roomTypes: [
      { name: "Sea Cabin", capacity: 4, amenities: ["Private Island", "Sea & Mountain Views", "Large Windows", "Modern Design"] },
    ]
  },
  {
    businessName: "Wild Caribou Dome",
    country: "Norway",
    city: "Northern Norway",
    latitude: 69.5000,
    longitude: 20.0000,
    businessServices: ["accommodation"],
    businessWebsite: "https://wildcaribou.no/",
    businessDescription: "Luxury glass dome tent for exclusive aurora viewing experience.",
    roomTypes: [
      { name: "Glass Dome", capacity: 2, amenities: ["Luxury Dome", "Exclusive", "Remote Location", "Premium Amenities"] },
    ]
  },
  {
    businessName: "Glød Explorer",
    country: "Norway",
    city: "Alta",
    latitude: 69.9689,
    longitude: 23.2717,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.glodexplorer.no/",
    businessDescription: "Glass domes for aurora viewing in Alta, the City of Northern Lights.",
    roomTypes: [
      { name: "Glass Dome", capacity: 2, amenities: ["Alta Location", "Aurora City", "Glass Dome", "Modern Facilities"] },
    ]
  },
  {
    businessName: "Flatmoen Nature Lodge",
    country: "Norway",
    city: "Hallingdal",
    latitude: 60.5500,
    longitude: 9.0500,
    businessServices: ["accommodation"],
    businessWebsite: "https://flatmoen.no/",
    businessDescription: "Half cabin, half glass igloo with outdoor jacuzzi in southern Norway mountains.",
    roomTypes: [
      { name: "Hybrid Glass Igloo", capacity: 2, amenities: ["Half Cabin/Half Glass", "Outdoor Jacuzzi", "Mountain Views", "Unique Design"] },
    ]
  },
  {
    businessName: "Norwegian Wild",
    country: "Norway",
    city: "Senja",
    latitude: 69.3000,
    longitude: 17.8000,
    businessServices: ["accommodation"],
    businessWebsite: "https://norwegianwild.no/",
    businessDescription: "Glass front huts on the water on Senja island, Norway's second largest island.",
    roomTypes: [
      { name: "Glass Front Hut", capacity: 2, amenities: ["Waterfront", "Senja Island", "Glass Walls", "Ocean Views"] },
    ]
  },
  {
    businessName: "Aurora Borealis Observatory",
    country: "Norway",
    city: "Senja",
    latitude: 69.2500,
    longitude: 17.7500,
    businessServices: ["accommodation"],
    businessWebsite: "https://auroraborealisobservatory.com/",
    businessDescription: "One exclusive glass igloo on Senja island for aurora observation.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Exclusive", "Senja Island", "Observatory Quality", "Premium Location"] },
    ]
  },
  {
    businessName: "Arctic Dome",
    country: "Norway",
    city: "Narvik",
    latitude: 68.4385,
    longitude: 17.4272,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticdome.no/",
    businessDescription: "Standalone dome on mountainside overlooking Narvik fjord.",
    roomTypes: [
      { name: "Mountain Dome", capacity: 2, amenities: ["Mountainside", "Fjord Views", "Standalone", "Panoramic Glass"] },
    ]
  },
  {
    businessName: "Hattvika Lodge",
    country: "Norway",
    city: "Lofoten",
    latitude: 68.0833,
    longitude: 13.4667,
    businessServices: ["accommodation"],
    businessWebsite: "https://hattvika.no/",
    businessDescription: "Traditional Rorbu cabins and modern hotel rooms in Lofoten Islands.",
    roomTypes: [
      { name: "Rorbu Cabin", capacity: 4, amenities: ["Traditional Norwegian", "Lofoten Islands", "Waterfront", "Authentic"] },
      { name: "Hotel Room", capacity: 2, amenities: ["Modern", "Aurora Windows", "Lofoten Views", "Hotel Amenities"] },
    ]
  },
  {
    businessName: "Sorrisniva Igloo Hotel",
    country: "Norway",
    city: "Alta",
    latitude: 69.9300,
    longitude: 23.3500,
    businessServices: ["accommodation"],
    businessWebsite: "https://sorrisniva.no/",
    businessDescription: "Ice hotel with Northern Lights cabins along the Alta River.",
    roomTypes: [
      { name: "Ice Room", capacity: 2, amenities: ["Ice Hotel", "Unique Experience", "Alta River", "Winter Only"] },
      { name: "Northern Lights Cabin", capacity: 2, amenities: ["Warm Cabin", "Aurora Windows", "Year-Round", "Private Sauna"] },
    ]
  },

  // ============================================
  // SWEDEN
  // ============================================
  {
    businessName: "Aurora River Camp & Glass Igloos",
    country: "Sweden",
    city: "Jokkmokk",
    latitude: 66.6061,
    longitude: 19.8231,
    businessServices: ["accommodation"],
    businessWebsite: "https://aurorarivercamp.com/",
    businessDescription: "Glass igloos with clear walls and ceilings in boreal forests of Swedish Lapland.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["Boreal Forest", "Clear Glass", "Heated", "Private Facilities"] },
    ]
  },
  {
    businessName: "Peace & Quiet Hotel",
    country: "Sweden",
    city: "Jokkmokk",
    latitude: 66.6000,
    longitude: 19.8000,
    businessServices: ["accommodation"],
    businessWebsite: "https://peaceandquiet.se/",
    businessDescription: "Unique floating glass igloo boats on frozen lake in winter.",
    roomTypes: [
      { name: "Floating Glass Igloo Boat", capacity: 2, amenities: ["Floating", "Unique Concept", "Glass Igloo", "Lake Setting"] },
    ]
  },
  {
    businessName: "Treehotel",
    country: "Sweden",
    city: "Harads",
    latitude: 66.0792,
    longitude: 20.9339,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.treehotel.se/",
    businessDescription: "7 unique tree rooms including The Mirrorcube, suspended in forest canopy.",
    roomTypes: [
      { name: "The Mirrorcube", capacity: 2, amenities: ["Mirrored Exterior", "Tree Room", "Unique Design", "Aurora Viewing"] },
      { name: "The 7th Room", capacity: 2, amenities: ["Glass Walls", "Panoramic Views", "Luxury", "Tree Suite"] },
    ]
  },
  {
    businessName: "ICEHOTEL",
    country: "Sweden",
    city: "Jukkasjärvi",
    latitude: 67.8511,
    longitude: 20.6058,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.icehotel.com/",
    businessDescription: "World-famous ice hotel plus Torne River Aurora Huts for warm aurora viewing.",
    roomTypes: [
      { name: "Ice Room", capacity: 2, amenities: ["Ice Hotel", "Art Suites", "Unique", "Sleeping Bags"] },
      { name: "Torne River Aurora Hut", capacity: 2, amenities: ["Warm Cabin", "Glass Roof", "River View", "Heated"] },
    ]
  },
  {
    businessName: "Aurora Mountain Lodge",
    country: "Sweden",
    city: "Kiruna",
    latitude: 67.8558,
    longitude: 20.2253,
    businessServices: ["accommodation"],
    businessWebsite: "https://auroramountainlodge.com/",
    businessDescription: "Mountain lodge near Kiruna Airport with aurora viewing accommodations.",
    roomTypes: [
      { name: "Aurora Lodge Room", capacity: 2, amenities: ["Mountain Lodge", "Near Airport", "Aurora Windows", "Lodge Amenities"] },
    ]
  },
  {
    businessName: "Pinetree Lodge",
    country: "Sweden",
    city: "Särkimukka",
    latitude: 67.2833,
    longitude: 20.7500,
    businessServices: ["accommodation"],
    businessWebsite: "https://pinetreelodge.se/",
    businessDescription: "Wilderness lodge along Lainio River in Swedish Lapland.",
    roomTypes: [
      { name: "River View Cabin", capacity: 4, amenities: ["Lainio River", "Wilderness", "Aurora Windows", "Sauna"] },
    ]
  },

  // ============================================
  // ICELAND
  // ============================================
  {
    businessName: "Reykjavík Domes",
    country: "Iceland",
    city: "Reykjavík",
    latitude: 64.1036,
    longitude: -21.8187,
    businessServices: ["accommodation"],
    businessWebsite: "https://reykjavikdomes.com/",
    businessDescription: "25m² and 35m² deluxe domes just 10 km from Reykjavik city center.",
    roomTypes: [
      { name: "25m² Dome", capacity: 2, amenities: ["Near Reykjavik", "Heated Dome", "Private Bathroom", "Close to City"] },
      { name: "35m² Deluxe Dome", capacity: 2, amenities: ["Larger Space", "Premium Amenities", "Luxury Interior", "Hot Tub Access"] },
    ]
  },
  {
    businessName: "Aurora Igloo",
    country: "Iceland",
    city: "Hella",
    latitude: 63.8406,
    longitude: -20.4028,
    businessServices: ["accommodation"],
    businessWebsite: "https://auroraigloo.is/",
    businessDescription: "Standard and Private igloos, 100 km from Reykjavik along South Coast.",
    roomTypes: [
      { name: "Standard Igloo", capacity: 2, amenities: ["Glass Igloo", "South Coast", "Heated", "Shared Facilities"] },
      { name: "Private Igloo", capacity: 2, amenities: ["Private", "Glass Igloo", "En-suite Bathroom", "More Space"] },
    ]
  },
  {
    businessName: "Panorama Glass Lodge",
    country: "Iceland",
    city: "West Iceland",
    latitude: 64.9000,
    longitude: -21.9500,
    businessServices: ["accommodation"],
    businessWebsite: "https://panoramaglasslodge.com/",
    businessDescription: "Two locations (West and South Iceland), trademarked luxury glass accommodations.",
    roomTypes: [
      { name: "Glass Lodge", capacity: 2, amenities: ["Panoramic Glass", "Luxury", "Two Locations", "Premium Amenities"] },
    ]
  },
  {
    businessName: "Tiny Glass Lodge",
    country: "Iceland",
    city: "Golden Circle",
    latitude: 64.3183,
    longitude: -20.1203,
    businessServices: ["accommodation"],
    businessWebsite: "https://tinyglasslodge.com/",
    businessDescription: "Compact glass lodges along the Golden Circle route.",
    roomTypes: [
      { name: "Tiny Glass Lodge", capacity: 2, amenities: ["Golden Circle", "Compact", "Glass Walls", "Cozy"] },
    ]
  },
  {
    businessName: "Buubble Hotel Ölvisholt",
    country: "Iceland",
    city: "Ölvisholt",
    latitude: 63.8667,
    longitude: -20.3000,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.buubble.com/",
    businessDescription: "Transparent dome accommodation for immersive nature and aurora experience.",
    roomTypes: [
      { name: "Transparent Bubble", capacity: 2, amenities: ["Transparent Dome", "Immersive", "Unique Experience", "Shared Facilities"] },
    ]
  },
  {
    businessName: "Buubble Hotel at Hrosshagi",
    country: "Iceland",
    city: "Hrosshagi",
    latitude: 64.0833,
    longitude: -21.5000,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.buubble.com/",
    businessDescription: "Transparent dome in forest setting for private aurora viewing.",
    roomTypes: [
      { name: "Forest Bubble", capacity: 2, amenities: ["Forest Setting", "Transparent", "Private", "Nature Experience"] },
    ]
  },
  {
    businessName: "Golden Circle Domes",
    country: "Iceland",
    city: "Golden Circle",
    latitude: 64.3100,
    longitude: -20.3000,
    businessServices: ["accommodation"],
    businessWebsite: "https://goldencircledomes.is/",
    businessDescription: "Premium glamping domes along the famous Golden Circle route.",
    roomTypes: [
      { name: "Premium Dome", capacity: 2, amenities: ["Golden Circle", "Glamping", "Premium", "Modern Amenities"] },
    ]
  },
  {
    businessName: "ION Adventure Hotel",
    country: "Iceland",
    city: "Mount Hengill",
    latitude: 64.0333,
    longitude: -21.3667,
    businessServices: ["accommodation"],
    businessWebsite: "https://ioniceland.is/",
    businessDescription: "Floor-to-ceiling windows overlooking lava fields, 40 km from Reykjavik.",
    roomTypes: [
      { name: "Adventure Room", capacity: 2, amenities: ["Floor-to-Ceiling Windows", "Lava Views", "Spa", "Design Hotel"] },
    ]
  },
  {
    businessName: "Klettar Tower",
    country: "Iceland",
    city: "Fludir",
    latitude: 64.1167,
    longitude: -20.3000,
    businessServices: ["accommodation"],
    businessWebsite: "https://klettartower.is/",
    businessDescription: "4 rooms with panorama view top floor, 100 km from Reykjavik.",
    roomTypes: [
      { name: "Tower Panorama Room", capacity: 2, amenities: ["Tower Top Floor", "360° Views", "Unique", "Panoramic Windows"] },
    ]
  },
  {
    businessName: "Northern Lights Iglúhús",
    country: "Iceland",
    city: "South Iceland",
    latitude: 63.9500,
    longitude: -20.5000,
    businessServices: ["accommodation"],
    businessWebsite: "https://nliluhus.is/",
    businessDescription: "Heated wooden igloo with 360° views in South Iceland.",
    roomTypes: [
      { name: "Iglúhús", capacity: 2, amenities: ["360° Views", "Heated", "Wooden Structure", "Glass Dome"] },
    ]
  },

  // ============================================
  // ALASKA, USA
  // ============================================
  {
    businessName: "Borealis Basecamp",
    country: "United States",
    city: "Fairbanks, Alaska",
    latitude: 64.8378,
    longitude: -147.7164,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.borealisbasecamp.com/",
    businessDescription: "20 fiberglass geodesic igloos plus 5 aurora-viewing cubes with 16-foot curved dome windows.",
    roomTypes: [
      { name: "Geodesic Igloo", capacity: 2, amenities: ["16-foot Dome Window", "Heated", "Curved Glass", "Modern Facilities"] },
      { name: "Aurora Viewing Cube", capacity: 2, amenities: ["Viewing Cube", "Large Windows", "Premium", "Basecamp Amenities"] },
    ]
  },
  {
    businessName: "Arctic Igloo Resort",
    country: "United States",
    city: "Fairbanks, Alaska",
    latitude: 64.9000,
    longitude: -147.7500,
    businessServices: ["accommodation"],
    businessWebsite: "https://arcticiglooalaska.com/",
    businessDescription: "Glass igloo hotel 22 miles from Fairbanks with 180° glass dome.",
    roomTypes: [
      { name: "Glass Igloo", capacity: 2, amenities: ["180° Glass Dome", "22 mi from Fairbanks", "Heated", "Private Bathroom"] },
    ]
  },
  {
    businessName: "Pleasant Acres Reindeer Ranch",
    country: "United States",
    city: "Fairbanks, Alaska",
    latitude: 64.8500,
    longitude: -147.8000,
    businessServices: ["accommodation"],
    businessWebsite: "https://pleasantacresreindeerranch.com/",
    businessDescription: "Fiberglass igloos on raised decks at working reindeer ranch.",
    roomTypes: [
      { name: "Reindeer Ranch Igloo", capacity: 2, amenities: ["Reindeer Ranch", "Raised Deck", "Fiberglass Dome", "Farm Experience"] },
    ]
  },
  {
    businessName: "Arctic Hive",
    country: "United States",
    city: "Brooks Range, Alaska",
    latitude: 67.4167,
    longitude: -150.1167,
    businessServices: ["accommodation"],
    businessWebsite: "https://www.arctichive.com/",
    businessDescription: "Fiberglass igloo common area, 63 miles above Arctic Circle in remote Brooks Range.",
    roomTypes: [
      { name: "Arctic Cabin", capacity: 2, amenities: ["63 mi Above Arctic Circle", "Remote", "Igloo Common Area", "Wilderness"] },
    ]
  },
  {
    businessName: "Chena Hot Springs Resort",
    country: "United States",
    city: "Fairbanks, Alaska",
    latitude: 65.0539,
    longitude: -146.0539,
    businessServices: ["accommodation"],
    businessWebsite: "https://chenahotsprings.com/",
    businessDescription: "Various lodging options with aurora viewing opportunities and natural hot springs.",
    roomTypes: [
      { name: "Resort Room", capacity: 2, amenities: ["Hot Springs Access", "Aurora Viewing", "Resort Amenities", "Restaurant"] },
    ]
  },

  // ============================================
  // CANADA
  // ============================================
  {
    businessName: "Blachford Lake Lodge",
    country: "Canada",
    city: "Northwest Territories",
    latitude: 62.7500,
    longitude: -113.3333,
    businessServices: ["accommodation"],
    businessWebsite: "https://blachfordlakelodge.com/",
    businessDescription: "Private timber cabins with aurora viewing on remote wilderness lake accessible only by float plane.",
    roomTypes: [
      { name: "Timber Cabin", capacity: 2, amenities: ["Wilderness Lake", "Float Plane Access", "Remote", "Aurora Windows"] },
    ]
  },

  // ============================================
  // GREENLAND
  // ============================================
  {
    businessName: "Hotel Arctic",
    country: "Greenland",
    city: "Ilulissat",
    latitude: 69.2198,
    longitude: -51.0986,
    businessServices: ["accommodation"],
    businessWebsite: "https://hotelarctic.com/",
    businessDescription: "Igloo-style Arctic rooms overlooking Icefjord UNESCO site (May-October season).",
    roomTypes: [
      { name: "Arctic Igloo Room", capacity: 2, amenities: ["Icefjord Views", "UNESCO Site", "May-October", "Arctic Design"] },
    ]
  },
];

async function main() {
  console.log("🌌 Starting accommodation seeding...");

  let createdCount = 0;
  let errorCount = 0;

  for (const accommodation of accommodations) {
    try {
      // Create business user account (unclaimed)
      const user = await prisma.user.create({
        data: {
          businessName: accommodation.businessName,
          userType: "business",
          businessServices: accommodation.businessServices,
          businessWebsite: accommodation.businessWebsite,
          businessDescription: accommodation.businessDescription,
          businessCity: accommodation.city,
          businessCountry: accommodation.country,
          latitude: accommodation.latitude,
          longitude: accommodation.longitude,
          verificationStatus: "verified", // Auto-verified for seed data
          verifiedAt: new Date(),
          onboardingComplete: false, // Not claimed yet
        },
      });

      // Create room types
      if (accommodation.roomTypes) {
        for (const [index, roomType] of accommodation.roomTypes.entries()) {
          await prisma.roomType.create({
            data: {
              businessId: user.id,
              name: roomType.name,
              description: roomType.description || null,
              capacity: roomType.capacity,
              amenities: roomType.amenities || [],
              displayOrder: index,
              isActive: true,
            },
          });
        }
      }

      console.log(`✅ Created: ${accommodation.businessName} (${accommodation.city}, ${accommodation.country})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating ${accommodation.businessName}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`✅ Created: ${createdCount} accommodations`);
  console.log(`❌ Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
