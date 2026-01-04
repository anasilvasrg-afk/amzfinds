// This script fetches outfit data from Firebase and saves it as JSON
// Run during build: node scripts/fetch-data.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Firebase config - using REST API with public project (no service account needed for read-only)
const FIREBASE_PROJECT_ID = 'shop-website-c1a5f';

async function fetchOutfits() {
  try {
    // Use Firebase REST API (public read access)
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/outfits`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Firestore format to clean JSON
    const outfits = (data.documents || []).map(doc => {
      const fields = doc.fields;
      const id = doc.name.split('/').pop();
      
      return {
        id,
        mainImage: fields.mainImage?.stringValue || '',
        season: fields.season?.stringValue || 'fall',
        slug: fields.slug?.stringValue || id,
        seoTitle: fields.seoTitle?.stringValue || '',
        metaDescription: fields.metaDescription?.stringValue || '',
        mainImageAlt: fields.mainImageAlt?.stringValue || '',
        fullSeoDescription: fields.fullSeoDescription?.stringValue || '',
        outfitCode: fields.outfitCode?.stringValue || '',
        dateAdded: fields.dateAdded?.stringValue || new Date().toISOString(),
        items: (fields.items?.arrayValue?.values || []).map(item => ({
          name: item.mapValue?.fields?.name?.stringValue || '',
          image: item.mapValue?.fields?.image?.stringValue || '',
          link: item.mapValue?.fields?.link?.stringValue || '',
          altText: item.mapValue?.fields?.altText?.stringValue || '',
          isAccessory: item.mapValue?.fields?.isAccessory?.booleanValue || false,
          category: item.mapValue?.fields?.category?.stringValue || ''
        }))
      };
    });
    
    // Sort by dateAdded descending (newest first)
    outfits.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    
    // Ensure src/data directory exists
    const dataDir = join(__dirname, '..', 'src', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    // Write to JSON file
    writeFileSync(
      join(dataDir, 'outfits.json'),
      JSON.stringify(outfits, null, 2)
    );
    
    console.log(`✅ Fetched ${outfits.length} outfits from Firebase`);
    return outfits;
    
  } catch (error) {
    console.error('Error fetching outfits:', error);
    
    // If fetch fails, create empty array so build doesn't break
    const dataDir = join(__dirname, '..', 'src', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(
      join(dataDir, 'outfits.json'),
      JSON.stringify([])
    );
    
    console.log('⚠️ Created empty outfits.json due to fetch error');
    return [];
  }
}

fetchOutfits();
