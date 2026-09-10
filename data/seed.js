const db = require('../database');

const sampleStudents = [
  {
    name: "Aarav Patel",
    email: "aarav.patel@gmail.com",
    phone: "+91 9823412345",
    insta: "aarav_vibes",
    gender: "Male",
    year: "2nd Year",
    musicTaste: "Hip-Hop, The Weeknd, Travis Scott",
    hobbies: "Late-night Gaming, Gym, Sneaker collecting",
    personality: "Extrovert"
  },
  {
    name: "Diya Sharma",
    email: "diya.sharma@gmail.com",
    phone: "+91 9876501234",
    insta: "diya_lens",
    gender: "Female",
    year: "2nd Year",
    musicTaste: "Indie Pop, Taylor Swift, Prateek Kuhad",
    hobbies: "Cafe hopping, Film Photography, Reading fantasy novels",
    personality: "Introvert"
  },
  {
    name: "Rohan Varma",
    email: "rohan.v@gmail.com",
    phone: "+91 9123456789",
    insta: "rohan_music",
    gender: "Male",
    year: "3rd Year",
    musicTaste: "Rock, Arctic Monkeys, Pink Floyd",
    hobbies: "Guitar playing, Jamming, Trekking",
    personality: "Ambivert"
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    phone: "+91 9765432100",
    insta: "ananya_clicks",
    gender: "Female",
    year: "3rd Year",
    musicTaste: "Alt-Rock, Cigarettes After Sex, Billie Eilish",
    hobbies: "Guitar, Coffee brewing, Writing poetry",
    personality: "Introvert"
  },
  {
    name: "Kabir Mehta",
    email: "kabir.m@gmail.com",
    phone: "+91 9845012345",
    insta: "kabir_m",
    gender: "Male",
    year: "1st Year",
    musicTaste: "EDM, Martin Garrix, Bollywood Remixes",
    hobbies: "Football, Anime watching, Coding hackathons",
    personality: "Extrovert"
  },
  {
    name: "Meera Sen",
    email: "meera.sen@gmail.com",
    phone: "+91 9898989898",
    insta: "meerasen",
    gender: "Female",
    year: "1st Year",
    musicTaste: "K-Pop, BTS, Pop, Ariana Grande",
    hobbies: "Baking, Anime, Graphic Design",
    personality: "Ambivert"
  }
];

console.log('Seeding HangMate with sample college participants...');
try {
  sampleStudents.forEach(s => {
    try {
      db.addStudent(s);
      console.log(`✓ Added ${s.name}`);
    } catch (e) {
      // Already exists
    }
  });
  console.log('✨ Seeding complete! You have students ready to pair.');
} catch (err) {
  console.error('Seeding error:', err);
}
