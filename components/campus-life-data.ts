import { sitePath } from './site-base';
// Original content and image paths from campus_life_extracted(1).html.
const campusSceneSource = [
  {
    "id": "intro",
    "background": sitePath("/assets/life-culture.webp"),
    "backgroundFallback": sitePath("/assets/life-culture.webp"),
    "theme": "tour-light",
    "alignment": "",
    "tag": "DBS Global University",
    "title": "Experience Life\nBeyond Classrooms",
    "subtitle": "Where academics, innovation, culture, and campus life come together to shape future-ready leaders.",
    "description": "At DBS Global University students experience much more than traditional education. From modern learning spaces and industry-focused programs to cultural events, sports, international exposure, and vibrant student communities.",
    "photos": [
      {
        "src": sitePath("/assets/life-dance-detail.webp"),
        "alt": "Aerial Campus",
        "fallback": sitePath("/assets/life-dance-detail.webp")
      },
      {
        "src": sitePath("/assets/life-culture-detail.webp"),
        "alt": "Modern Infrastructure",
        "fallback": sitePath("/assets/life-culture-detail.webp")
      }
    ]
  },
  {
    "id": "cultural",
    "background": sitePath("/assets/gallery-1.webp"),
    "backgroundFallback": sitePath("/assets/gallery-1.webp"),
    "theme": "tour-light",
    "alignment": "align-right",
    "tag": "Cultural Activities",
    "title": "A Campus Full of Energy,\nCreativity & Talent",
    "subtitle": "Students don't just study here — they perform, lead, create, and celebrate.",
    "description": "Cultural activities at DBS Global University give students the platform to showcase their talents in music, dance, drama, fashion, media, and events. Most activities are student-managed, encouraging leadership and teamwork.",
    "photos": [
      {
        "src": "https://images.unsplash.com/photo-1540039155732-d69284458f27?w=600&q=80",
        "alt": "Fest Stage Performance",
        "fallback": sitePath("/assets/gallery-1.webp")
      },
      {
        "src": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
        "alt": "Crowd Cheering",
        "fallback": sitePath("/assets/life-concert-detail.webp")
      }
    ]
  },
  {
    "id": "clubs",
    "background": sitePath("/assets/life-clubs.webp"),
    "backgroundFallback": sitePath("/assets/life-clubs.webp"),
    "theme": "tour-dark",
    "alignment": "",
    "tag": "Student Engagement",
    "title": "More Than 22+ Clubs &\nEndless Campus Activities",
    "subtitle": "From robotics to sports — every passion finds its space here.",
    "description": "The university offers multiple student clubs, hackathons, and credit-backed passion courses. Sports and extracurricular activities are deeply integrated into campus life for balanced growth.",
    "photos": [
      {
        "src": sitePath("/assets/life-sports-detail.webp"),
        "alt": "Basketball Sports",
        "fallback": sitePath("/assets/life-sports-detail.webp")
      },
      {
        "src": sitePath("/assets/life-chess-detail.webp"),
        "alt": "Robotics Club",
        "fallback": sitePath("/assets/life-chess-detail.webp")
      }
    ]
  },
  {
    "id": "global",
    "background": sitePath("/assets/life-industry.webp"),
    "backgroundFallback": sitePath("/assets/life-industry.webp"),
    "theme": "tour-light",
    "alignment": "align-right",
    "tag": "Career Opportunities",
    "title": "Industry Exposure &\nGlobal Learning",
    "subtitle": "International immersion, certifications, placements, and future-ready learning.",
    "description": "Students gain practical exposure through 50+ global collaborations, NISM immersions, and elite SAP/SAS training. The university prepares students entirely for the modern corporate arena.",
    "photos": [
      {
        "src": sitePath("/assets/life-goa-detail.webp"),
        "alt": "Corporate Training",
        "fallback": sitePath("/assets/life-goa-detail.webp")
      },
      {
        "src": sitePath("/assets/life-dubai-detail.webp"),
        "alt": "International Tour",
        "fallback": sitePath("/assets/life-dubai-detail.webp")
      }
    ]
  },
  {
    "id": "hostel",
    "background": sitePath("/assets/hotel.webp"),
    "backgroundFallback": sitePath("/assets/life-hostel.webp"),
    "theme": "tour-dark",
    "alignment": "align-center",
    "tag": "Student Experience",
    "title": "A Comfortable & Vibrant\nHome Away From Home",
    "subtitle": "Safe, modern, and student-friendly hostel life.",
    "description": "The hostel experience at DBS Global University is designed to provide comfort, safety, and community living. Well-furnished residences, Wi-Fi, sports facilities, and common areas await all 3000+ students.",
    "photos": [
      {
        "src": sitePath("/assets/life-dining-detail.webp"),
        "alt": "Hostel Exterior",
        "fallback": sitePath("/assets/life-dining-detail.webp")
      },
      {
        "src": sitePath("/assets/life-room-detail.webp"),
        "alt": "Students in Common Area",
        "fallback": sitePath("/assets/life-room-detail.webp")
      }
    ]
  }
];

// The Clubs story now appears before Cultural Activities in the pinned sequence.
export const campusScenes = ['intro', 'clubs', 'cultural', 'global', 'hostel']
  .map(id => campusSceneSource.find(scene => scene.id === id)!);
