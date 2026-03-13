// ============================================================
// MIR — Database Test / Smoke Check
// Run: node src/db/test-db.js
// ============================================================

require('dotenv').config({ path: '../../.env' });

const { getDb, seedDevData } = require('./schema');
const { reviews, reviewItems, chatMessages } = require('./queries');

console.log('🔍 MIR Database Test\n');

try {
  // Init DB
  const db = getDb();
  console.log('✅ Database connected:', db.name);

  // Seed
  seedDevData();

  // Create a review
  const reviewId = reviews.create(null, 7, 3);
  console.log('✅ Created review id:', reviewId);

  // Add items
  const item1 = reviewItems.add(reviewId, 'Test moment 1', 'situation', 6);
  const item2 = reviewItems.add(reviewId, 'Test moment 2', 'relationship', 8);
  console.log('✅ Added review items:', item1, item2);

  // Update intensity after
  reviewItems.setIntensityAfter(item1, 2);
  console.log('✅ Updated intensity after');

  // Complete review
  reviews.complete(reviewId);
  console.log('✅ Completed review');

  // Save chat messages
  chatMessages.save(null, reviewId, 'user', 'Hello MIR');
  chatMessages.save(null, reviewId, 'assistant', 'The night is quiet. What are you carrying?');
  console.log('✅ Saved chat messages');

  // Read back
  const review = reviews.getById(reviewId);
  const items = reviewItems.getByReview(reviewId);
  const msgs = chatMessages.getByReview(reviewId);

  console.log('\n📋 Review:', JSON.stringify(review, null, 2));
  console.log('\n📋 Items:', JSON.stringify(items, null, 2));
  console.log('\n📋 Messages:', JSON.stringify(msgs, null, 2));

  console.log('\n✨ All database tests passed');
} catch (err) {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
}
