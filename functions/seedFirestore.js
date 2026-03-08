const admin = require("firebase-admin");

// Initialize with the service account from the functions directory
// Since we're logged in via Firebase CLI, use application default credentials
admin.initializeApp({
  projectId: "thomas-samuel-media",
});

const db = admin.firestore();

const services = [
  {
    name: "Base Package",
    slug: "base-package",
    category: "real-estate",
    description: "Essential real estate media package. Includes professional HDR photography, immersive Matterport 3D tour, and detailed floor plan — everything you need for a standout listing.",
    duration: 90,
    basePrice: 55000,
    depositRequired: 50,
    deliverables: ["HDR Photos", "Matterport 3D Tour", "Floor Plan"],
    addons: ["addon-1", "addon-2", "addon-3", "addon-4", "addon-5", "addon-6", "addon-7", "addon-8", "addon-9", "addon-10"],
    bufferTime: 30,
    minNotice: 24,
    maxAdvance: 90,
    isActive: true,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    sortOrder: 1,
    pricingTiers: {
      "0–2,000 sqft": 55000,
      "2,001–3,000 sqft": 65000,
      "3,001–4,000 sqft": 75000,
      "4,001–5,000 sqft": 85000,
      "5,001+ sqft": 100000,
    },
  },
  {
    name: "Standard Package",
    slug: "standard-package",
    category: "real-estate",
    description: "Our most popular package. Includes HDR photos, drone aerials, a 30-45 second highlight reel, Matterport 3D tour, and floor plan — perfect for attracting buyers with stunning visuals.",
    duration: 120,
    basePrice: 75000,
    depositRequired: 50,
    deliverables: ["HDR Photos + Drone", "30-45 Sec Highlight Reel", "Matterport 3D Tour", "Floor Plan"],
    addons: ["addon-1", "addon-2", "addon-3", "addon-4", "addon-5", "addon-6", "addon-7", "addon-8", "addon-9", "addon-10"],
    bufferTime: 30,
    minNotice: 24,
    maxAdvance: 90,
    isActive: true,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    sortOrder: 2,
    pricingTiers: {
      "0–2,000 sqft": 75000,
      "2,001–3,000 sqft": 85000,
      "3,001–4,000 sqft": 100000,
      "4,001–5,000 sqft": 120000,
      "5,001+ sqft": 135000,
    },
  },
  {
    name: "Standard Plus Package",
    slug: "standard-plus-package",
    category: "real-estate",
    description: "Elevated listing media with a cinematic touch. Includes HDR photos, drone aerials, a 1-2 minute cinematic walkthrough video, Matterport 3D tour, and floor plan.",
    duration: 150,
    basePrice: 95000,
    depositRequired: 50,
    deliverables: ["HDR Photos + Drone", "1-2 Min Cinematic Walkthrough Video", "Matterport 3D Tour", "Floor Plan"],
    addons: ["addon-1", "addon-2", "addon-3", "addon-4", "addon-5", "addon-6", "addon-7", "addon-8", "addon-9", "addon-10"],
    bufferTime: 30,
    minNotice: 24,
    maxAdvance: 90,
    isActive: true,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    sortOrder: 3,
    pricingTiers: {
      "0–2,000 sqft": 95000,
      "2,001–3,000 sqft": 115000,
      "3,001–4,000 sqft": 130000,
      "4,001–5,000 sqft": 140000,
      "5,001+ sqft": 170000,
    },
  },
  {
    name: "Pro Package",
    slug: "pro-package",
    category: "real-estate",
    description: "Premium marketing package with personalized agent branding. Includes HDR photos, drone aerials, 1-2 minute cinematic walkthrough video with agent intro/outro, Matterport 3D tour, and floor plan.",
    duration: 180,
    basePrice: 125000,
    depositRequired: 50,
    deliverables: ["HDR Photos + Drone", "1-2 Min Cinematic Walkthrough Video", "Agent Intro/Outro", "Matterport 3D Tour", "Floor Plan"],
    addons: ["addon-1", "addon-2", "addon-3", "addon-4", "addon-5", "addon-6", "addon-7", "addon-8", "addon-9", "addon-10"],
    bufferTime: 60,
    minNotice: 48,
    maxAdvance: 90,
    isActive: true,
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    sortOrder: 4,
    pricingTiers: {
      "0–2,000 sqft": 125000,
      "2,001–3,000 sqft": 142500,
      "3,001–4,000 sqft": 160000,
      "4,001–5,000 sqft": 175000,
      "5,001+ sqft": 200000,
    },
  },
  {
    name: "Unlimited Package",
    slug: "unlimited-package",
    category: "real-estate",
    description: "The ultimate listing media package — everything included. HDR photos, drone aerials, 1-2 minute cinematic walkthrough, agent intro/outro, vertical walkthrough reel for social media, Matterport 3D tour, and floor plan.",
    duration: 240,
    basePrice: 175000,
    depositRequired: 50,
    deliverables: ["HDR Photos + Drone", "1-2 Min Cinematic Walkthrough Video", "Agent Intro/Outro", "Vertical Walkthrough Reel", "Matterport 3D Tour", "Floor Plan"],
    addons: ["addon-1", "addon-2", "addon-3", "addon-4", "addon-5", "addon-6", "addon-7", "addon-8", "addon-9", "addon-10"],
    bufferTime: 60,
    minNotice: 48,
    maxAdvance: 90,
    isActive: true,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
    sortOrder: 5,
    pricingTiers: {
      "0–2,000 sqft": 175000,
      "2,001–3,000 sqft": 200000,
      "3,001–4,000 sqft": 225000,
      "4,001–5,000 sqft": 240000,
      "5,001+ sqft": 250000,
    },
  },
];

const addOns = [
  {
    name: "Agent Intro/Outro",
    description: "Custom branded agent intro and outro for property videos",
    price: 10000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Area Highlight Video",
    description: "Showcase neighborhood amenities and area highlights",
    price: 15000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Cinematic Video",
    description: "Professional cinematic walkthrough video of the property",
    price: 50000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Drone Photos",
    description: "Aerial drone photography showcasing property and surroundings",
    price: 22500,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Floor Plan",
    description: "Detailed 2D floor plan of the property layout",
    price: 10000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "HDR Photos",
    description: "Professional HDR photography for your property listing",
    price: 25000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "IG Walkthrough Reel",
    description: "Vertical social media reel for Instagram/TikTok marketing",
    price: 25000,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Matterport 3D Tour",
    description: "Immersive 3D virtual tour of the property",
    price: 22500,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Twilight Photos",
    description: "Stunning twilight/golden hour exterior photography",
    price: 22500,
    priceType: "fixed",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
  {
    name: "Virtual Staging",
    description: "Digital furniture staging for empty rooms — per photo",
    price: 2500,
    priceType: "per-photo",
    applicableServices: ["svc-1", "svc-2", "svc-3", "svc-4", "svc-5"],
    isActive: true,
  },
];

const testimonials = [
  {
    name: "hi there",
    role: "",
    company: "",
    content: "Thomas shot photos for our Airbnb, and we couldn't be happier. The photos turned out great and he made sure we were 100% satisfied. 10/10 would use him again! ",
    rating: 5,
    avatar: "",
    category: "real-estate",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-06-01")),
  },
  {
    name: "Kyle Rose",
    role: "",
    company: "",
    content: "Thomas is great to work with, and he is absolutely dedicated to producing a good product and to making sure the client is happy with the process and with the outcome. For reasons not related to Thomas' fine work, we ended up needing additional edits and formatting, and he came to our office, personally, to drop off the end product and stayed to make sure it was exactly what we needed. His work, and work ethic, are fantastic! It was our good fortune to have crossed paths, and our clients loved what Thomas created, so we looked like heroes. ",
    rating: 5,
    avatar: "",
    category: "brand",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-07-01")),
  },
  {
    name: "Chip Reno",
    role: "",
    company: "",
    content: "Thomas did a fantastic job at taking listing photos for my condo in Capitol Hill. The 3D walkthrough and photos resulted in my condo renting out within 48 hours. He was very professional, punctual, and a pleasure to work with. ",
    rating: 5,
    avatar: "",
    category: "real-estate",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-08-01")),
  },
  {
    name: "Dominque Meeks",
    role: "",
    company: "",
    content: "Thomas was able to provide me with quick, quality service and deliver exactly what I asked for! Thank you! I look forward to working together again in the future!",
    rating: 5,
    avatar: "",
    category: "brand",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-09-01")),
  },
  {
    name: "Brian Lavery",
    role: "",
    company: "",
    content: "Once you work with RealLuxe Studios, you'll see the difference with their photography and videos that exceeds any other person or company. Thomas shows his passion & dedication for his work, and his professionalism and knowledge of media... unlike no other person I've worked with in my 25+ years in real estate. ",
    rating: 5,
    avatar: "",
    category: "real-estate",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-10-01")),
  },
  {
    name: "Johnathan Cats",
    role: "",
    company: "",
    content: "Thomas shot photos for our Airbnb, and we couldn't be happier. The photos turned out great and he made sure we were 100% satisfied. 10/10 would use him again!",
    rating: 5,
    avatar: "",
    category: "real-estate",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-11-01")),
  },
  {
    name: "Christy Kinnaird",
    role: "",
    company: "",
    content: "Thomas is fantastic! He is fun to work with, prompt and professional, and produces excellent videos!",
    rating: 5,
    avatar: "",
    category: "video",
    status: "approved",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-12-01")),
  },
];

const portfolioCategories = ["real-estate", "brand", "video", "drone", "events"];

async function seedCollection(collectionName, dataArray) {
  console.log(`Seeding ${collectionName}...`);
  const batch = db.batch();
  for (const item of dataArray) {
    const docRef = db.collection(collectionName).doc();
    batch.set(docRef, item);
  }
  await batch.commit();
  console.log(`  ✅ ${dataArray.length} documents added to ${collectionName}`);
}

async function seedPortfolioCategories() {
  console.log("Seeding portfolio_categories...");
  const docRef = db.collection("settings").doc("portfolio_categories");
  await docRef.set({ categories: portfolioCategories });
  console.log("  ✅ Portfolio categories saved");
}

async function main() {
  try {
    console.log("Starting Firestore seed for thomas-samuel-media...\n");

    await seedCollection("services", services);
    await seedCollection("addons", addOns);
    await seedCollection("testimonials", testimonials);
    await seedPortfolioCategories();

    console.log("\n🎉 Firestore seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Firestore:", error);
    process.exit(1);
  }
}

main();
