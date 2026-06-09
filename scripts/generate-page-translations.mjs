#!/usr/bin/env node

/**
 * Translation Key Generator for Pages
 *
 * This script helps identify hardcoded text in page components and
 * generate corresponding translation keys.
 *
 * Usage: node scripts/generate-page-translations.mjs [pageName]
 * Example: node scripts/generate-page-translations.mjs aboutUs
 */

import fs from 'fs';
import path from 'path';

const pageTranslations = {
  aboutUs: {
    title: "About Us",
    heroTitle: "We're building the modern village for families",
    quoteText: "When families rise, society rises.",
    founderName: "Our Founder",
    valuesTitle: "Our Values",
    ctaTitle: "Ready to Join?"
  },
  marketplace: {
    title: "Marketplace",
    description: "Find and connect with trusted caregivers",
    findCaregivers: "Find Caregivers",
    hireCaregivers: "Hire Caregivers",
    searchPlaceholder: "Search caregivers...",
    filterBy: "Filter by",
    sortBy: "Sort by"
  },
  courses: {
    title: "Courses",
    description: "Learn from experts. Grow together.",
    browseCourses: "Browse Courses",
    myCourses: "My Courses",
    startLearning: "Start Learning",
    noCourses: "No courses yet",
    instructedBy: "Instructed by",
    duration: "Duration",
    price: "Price"
  },
  events: {
    title: "Events",
    description: "Connect with your community through events",
    upcomingEvents: "Upcoming Events",
    myEvents: "My Events",
    registerEvent: "Register for Event",
    noEvents: "No events yet",
    date: "Date",
    location: "Location",
    capacity: "Capacity"
  },
  terms: {
    title: "Terms & Conditions",
    description: "Terms of Service for The Raising Club",
    effectiveDate: "Effective date:",
    lastUpdated: "Last updated:",
    acceptTerms: "By using our platform, you agree to these terms",
    section1Title: "About The Raising Club",
    section2Title: "Acceptance of Terms",
    section3Title: "Eligibility",
    section4Title: "Account Types and Roles"
  },
  privacy: {
    title: "Privacy Policy",
    description: "How we protect your information",
    effectiveDate: "Effective date:",
    lastUpdated: "Last updated:",
    privacyIntro: "Your privacy is important to us",
    section1Title: "Information We Collect",
    section2Title: "How We Use Your Information",
    section3Title: "Data Security",
    section4Title: "Your Rights"
  },
  membership: {
    title: "Membership",
    description: "Choose the plan that works for you",
    selectPlan: "Select Plan",
    freePlan: "Free",
    premiumPlan: "Premium",
    viewPlans: "View All Plans",
    monthlyBilling: "Monthly Billing",
    annualBilling: "Annual Billing"
  }
};

function generateTranslationKeys(pageName) {
  const translations = pageTranslations[pageName];

  if (!translations) {
    console.error(`No translations found for page: ${pageName}`);
    console.error(`Available pages: ${Object.keys(pageTranslations).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📝 Translation Keys for ${pageName}:\n`);
  console.log(JSON.stringify({ [pageName]: translations }, null, 2));

  console.log(`\n✅ Usage in components:\n`);
  console.log(`import { useTranslations } from 'next-intl';`);
  console.log(`const t = useTranslations('pages.${pageName}');\n`);
  console.log(`// Then use: t('title'), t('description'), etc.`);
}

// Get page name from CLI arg
const pageName = process.argv[2];

if (!pageName) {
  console.log('📚 Available page translation templates:');
  Object.keys(pageTranslations).forEach(page => {
    console.log(`  - ${page}`);
  });
  console.log(`\nUsage: node scripts/generate-page-translations.mjs <pageName>`);
  process.exit(0);
}

generateTranslationKeys(pageName);
