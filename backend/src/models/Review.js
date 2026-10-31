const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, maxlength: 1000 },
}, { timestamps: true });

// One review per booking only — prevents spamming
reviewSchema.index({ bookingId: 1 }, { unique: true });

// Auto-update doctor's average rating after every save
reviewSchema.post('save', async function () {
  try {
    const stats = await this.constructor.aggregate([
      { $match: { doctorId: this.doctorId } },
      { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await mongoose.model('Doctor').findByIdAndUpdate(this.doctorId, {
        rating:       Math.round(stats[0].avgRating * 10) / 10,
        reviewsCount: stats[0].count
      });
    }
  } catch (err) {
    console.error('Review post-save hook error:', err.message);
  }
});

// Also recalculate on delete
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  try {
    const stats = await this.constructor.aggregate([
      { $match: { doctorId: this.doctorId } },
      { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    await mongoose.model('Doctor').findByIdAndUpdate(this.doctorId, {
      rating:       stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      reviewsCount: stats.length > 0 ? stats[0].count : 0,
    });
  } catch (err) {
    console.error('Review post-delete hook error:', err.message);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
