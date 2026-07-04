/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, Announcement, User } from '../types';

export const INITIAL_PRODUCTS_RAW = [
  {
    id: 1,
    productName: "Premium Leather Messenger Bag",
    productImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=60",
    baseCost: 975,
    rewardMultiplier: 0.15, // 15% reward
  },
  {
    id: 2,
    productName: "Pro Noise-Cancelling Wireless Headphones",
    productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60",
    baseCost: 1450,
    rewardMultiplier: 0.18, // 18% reward
  },
  {
    id: 3,
    productName: "Minimalist Automatic Mechanical Watch",
    productImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=60",
    baseCost: 2180,
    rewardMultiplier: 0.20, // 20% reward
  },
  {
    id: 4,
    productName: "Ergonomic Orthopedic Workspace Chair",
    productImage: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=400&auto=format&fit=crop&q=60",
    baseCost: 3270,
    rewardMultiplier: 0.22, // 22% reward
  },
  {
    id: 5,
    productName: "Ultra-Light Carbon Fiber Executive Smartpad",
    productImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=60",
    baseCost: 4900,
    rewardMultiplier: 0.25, // 25% reward
  },
  {
    id: 6,
    productName: "4K HDR Professional Design Monitor",
    productImage: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=60",
    baseCost: 7350,
    rewardMultiplier: 0.28, // 28% reward
  },
  {
    id: 7,
    productName: "Premium Handcrafted Walnut Desktop Console",
    productImage: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=60",
    baseCost: 11000,
    rewardMultiplier: 0.30, // 30% reward
  },
  {
    id: 8,
    productName: "Hi-Fi Studio Reference Soundbar System",
    productImage: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=60",
    baseCost: 16500,
    rewardMultiplier: 0.32, // 32% reward
  },
  {
    id: 9,
    productName: "Vanguard Titanium Expedition Camera Rig",
    productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=60",
    baseCost: 24700,
    rewardMultiplier: 0.35, // 35% reward
  },
  {
    id: 10,
    productName: "Hyperion Quantum Elite Workspace Station",
    productImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&auto=format&fit=crop&q=60",
    baseCost: 37000,
    rewardMultiplier: 0.40, // 40% reward
  }
];

export const ALTERNATIVE_PRODUCTS_POOLS: { [key: number]: { productName: string; productImage: string }[] } = {
  1: [
    { productName: "Premium Leather Messenger Bag", productImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=60" },
    { productName: "Handcrafted Canvas Utility Backpack", productImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=60" },
    { productName: "Classic Suede Leather Portfolio Case", productImage: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&auto=format&fit=crop&q=60" }
  ],
  2: [
    { productName: "Pro Noise-Cancelling Wireless Headphones", productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60" },
    { productName: "Ergonomic Mechanical Wireless Keyboard", productImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60" },
    { productName: "Audiophile Studio Monitor Earbuds", productImage: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=60" }
  ],
  3: [
    { productName: "Minimalist Automatic Mechanical Watch", productImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=60" },
    { productName: "Premium Stainless Chronograph Watch", productImage: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&auto=format&fit=crop&q=60" },
    { productName: "Vintage Brass Pocket Compass & Watch", productImage: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&auto=format&fit=crop&q=60" }
  ],
  4: [
    { productName: "Ergonomic Orthopedic Workspace Chair", productImage: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=400&auto=format&fit=crop&q=60" },
    { productName: "Premium Height-Adjustable Standing Desk", productImage: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&auto=format&fit=crop&q=60" },
    { productName: "Full-Body Air Massage Recliner Chair", productImage: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&auto=format&fit=crop&q=60" }
  ],
  5: [
    { productName: "Ultra-Light Carbon Fiber Executive Smartpad", productImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=60" },
    { productName: "Next-Gen Quad-Core Pro Tablet", productImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60" },
    { productName: "Dual-Screen Portable Business Monitor", productImage: "https://images.unsplash.com/photo-1585241938091-140774b22c54?w=400&auto=format&fit=crop&q=60" }
  ],
  6: [
    { productName: "4K HDR Professional Design Monitor", productImage: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=60" },
    { productName: "Vivid Ultra-Wide Curved Creator Display", productImage: "https://images.unsplash.com/photo-1551645121-d1034da75057?w=400&auto=format&fit=crop&q=60" },
    { productName: "Dolby Vision Professional Colorist Screen", productImage: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=60" }
  ],
  7: [
    { productName: "Premium Handcrafted Walnut Desktop Console", productImage: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=60" },
    { productName: "Solid Oak Modular Acoustic Desktop Shelf", productImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=60" },
    { productName: "Hand-Polished Obsidian Desk Organizer", productImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&auto=format&fit=crop&q=60" }
  ],
  8: [
    { productName: "Hi-Fi Studio Reference Soundbar System", productImage: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=60" },
    { productName: "Premium Wireless Multi-Room Smart Speaker", productImage: "https://images.unsplash.com/photo-1541829014-110255311053?w=400&auto=format&fit=crop&q=60" },
    { productName: "Audiophile Vacuum Tube Amplifier Block", productImage: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=60" }
  ],
  9: [
    { productName: "Vanguard Titanium Expedition Camera Rig", productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=60" },
    { productName: "Pro Cine-Lens Steady-Cam Stabilizer", productImage: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=400&auto=format&fit=crop&q=60" },
    { productName: "Ultra-HD Mirrorless Vloggers Master Kit", productImage: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=400&auto=format&fit=crop&q=60" }
  ],
  10: [
    { productName: "Hyperion Quantum Elite Workspace Station", productImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&auto=format&fit=crop&q=60" },
    { productName: "Apex Liquid-Cooled AI Rendering Rig", productImage: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=60" },
    { productName: "Galactic Ultimate Multi-Display Holo-Desk", productImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&auto=format&fit=crop&q=60" }
  ]
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "✨ Welcome to GOM!",
    content: "We are thrilled to launch our advanced order matching and scaling system. Register today to receive an instant 500 ETB Welcome Bonus! Complete 10 daily tasks to maximize your commissions.",
    createdAt: new Date().toISOString()
  },
  {
    id: "ann-2",
    title: "🏦 Supported Ethiopian Banks Updated",
    content: "All deposits and withdrawals are processed within 1-2 hours. Supported banks include: Commercial Bank of Ethiopia (CBE), Dashen Bank, Awash Bank, and Bank of Abyssinia. Standard bank transfer receipts are fully secure.",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Default accounts
export const DEFAULT_ADMIN_PASS_HASH = "cf689676bf2c5be633961d2659ecc8212c900a35eb3235a80f59a061b98ab938"; // SHA-256 for '193920'
export const DEFAULT_USER_PASS_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"; // SHA-256 for 'Password123'

export const INITIAL_USERS: User[] = [
  {
    id: "GOM-ADMIN",
    phoneNumber: "0926193920",
    passwordHash: DEFAULT_ADMIN_PASS_HASH,
    walletBalance: 1000000,
    welcomeBonus: 0,
    totalEarnings: 0,
    role: "admin",
    createdAt: new Date().toISOString(),
    currentOrderIndex: 0,
    completedOrderIds: []
  }
];
