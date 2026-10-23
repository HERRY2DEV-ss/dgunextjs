// Original content and image paths from campus_life_extracted(1).html.
const campusSceneSource = [
  {
    "id": "intro",
    "background": "/nextjs/homev1/assets/second.webp",
    "backgroundFallback": "/nextjs/homev1/assets/life-culture.webp",
    "theme": "tour-light",
    "alignment": "",
    "tag": "DBS Global University",
    "title": "Experience Life\nBeyond Classrooms",
    "subtitle": "Where academics, innovation, culture, and campus life come together to shape future-ready leaders.",
    "description": "At DBS Global University students experience much more than traditional education. From modern learning spaces and industry-focused programs to cultural events, sports, international exposure, and vibrant student communities.",
    "photos": [
      {
        "src": "/nextjs/homev1/assets/2nd1.webp",
        "alt": "Aerial Campus",
        "fallback": "/nextjs/homev1/assets/life-dance-detail.webp"
      },
      {
        "src": "/nextjs/homev1/assets/2nd2.webp",
        "alt": "Modern Infrastructure",
        "fallback": "/nextjs/homev1/assets/life-culture-detail.webp"
      }
    ]
  },
  {
    "id": "cultural",
    "background": "/nextjs/homev1/assets/third.webp",
    "backgroundFallback": "/nextjs/homev1/assets/gallery-1.webp",
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
        "fallback": "/nextjs/homev1/assets/gallery-1.webp"
      },
      {
        "src": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
        "alt": "Crowd Cheering",
        "fallback": "/nextjs/homev1/assets/life-concert-detail.webp"
      }
    ]
  },
  {
    "id": "clubs",
    "background": "/nextjs/homev1/assets/club.webp",
    "backgroundFallback": "/nextjs/homev1/assets/life-clubs.webp",
    "theme": "tour-dark",
    "alignment": "",
    "tag": "Student Engagement",
    "title": "More Than 22+ Clubs &\nEndless Campus Activities",
    "subtitle": "From robotics to sports — every passion finds its space here.",
    "description": "The university offers multiple student clubs, hackathons, and credit-backed passion courses. Sports and extracurricular activities are deeply integrated into campus life for balanced growth.",
    "photos": [
      {
        "src": "/nextjs/homev1/assets/club1.webp",
        "alt": "Basketball Sports",
        "fallback": "/nextjs/homev1/assets/life-sports-detail.webp"
      },
      {
        "src": "/nextjs/homev1/assets/club2.webp",
        "alt": "Robotics Club",
        "fallback": "/nextjs/homev1/assets/life-chess-detail.webp"
      }
    ]
  },
  {
    "id": "global",
    "background": "/nextjs/homev1/assets/international.webp",
    "backgroundFallback": "/nextjs/homev1/assets/life-industry.webp",
    "theme": "tour-light",
    "alignment": "align-right",
    "tag": "Career Opportunities",
    "title": "Industry Exposure &\nGlobal Learning",
    "subtitle": "International immersion, certifications, placements, and future-ready learning.",
    "description": "Students gain practical exposure through 50+ global collaborations, NISM immersions, and elite SAP/SAS training. The university prepares students entirely for the modern corporate arena.",
    "photos": [
      {
        "src": "/nextjs/homev1/assets/international1.webp",
        "alt": "Corporate Training",
        "fallback": "/nextjs/homev1/assets/life-goa-detail.webp"
      },
      {
        "src": "/nextjs/homev1/assets/international2.webp",
        "alt": "International Tour",
        "fallback": "/nextjs/homev1/assets/life-dubai-detail.webp"
      }
    ]
  },
  {
    "id": "hostel",
    "background": "/nextjs/homev1/assets/hotel.webp",
    "backgroundFallback": "/nextjs/homev1/assets/life-hostel.webp",
    "theme": "tour-dark",
    "alignment": "align-center",
    "tag": "Student Experience",
    "title": "A Comfortable & Vibrant\nHome Away From Home",
    "subtitle": "Safe, modern, and student-friendly hostel life.",
    "description": "The hostel experience at DBS Global University is designed to provide comfort, safety, and community living. Well-furnished residences, Wi-Fi, sports facilities, and common areas await all 3000+ students.",
    "photos": [
      {
        "src": "/nextjs/homev1/assets/h1.webp",
        "alt": "Hostel Exterior",
        "fallback": "/nextjs/homev1/assets/life-dining-detail.webp"
      },
      {
        "src": "/nextjs/homev1/assets/h2.webp",
        "alt": "Students in Common Area",
        "fallback": "/nextjs/homev1/assets/life-room-detail.webp"
      }
    ]
  }
];

// The Clubs story now appears before Cultural Activities in the pinned sequence.
export const campusScenes = ['intro', 'clubs', 'cultural', 'global', 'hostel']
  .map(id => campusSceneSource.find(scene => scene.id === id)!);
