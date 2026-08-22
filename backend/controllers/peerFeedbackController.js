import PeerFeedback from '../models/PeerFeedback.js';
import Employee from '../models/Employee.js';

/**
 * POST /api/feedback/submit
 * Protect middleware ensures req.user is set
 */
export const submitFeedback = async (req, res) => {
  try {
    const { targetEmployeeId, rating, collaborationTags } = req.body;

    // Derive source from authenticated user
    const sourceEmployeeId = req.user._id;

    if (!targetEmployeeId) {
      return res.status(400).json({ success: false, error: 'Target employee ID is required.' });
    }

    // Reject self-feedback
    if (sourceEmployeeId.toString() === targetEmployeeId.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot submit feedback for yourself.' });
    }

    // Validate target employee exists
    const targetEmployee = await Employee.findById(targetEmployeeId);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, error: 'Target employee not found.' });
    }

    // Validate rating
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be a number between 1 and 5.' });
      }
    }

    // Validate collaborationTags
    if (collaborationTags !== undefined) {
      if (!Array.isArray(collaborationTags) || !collaborationTags.every(tag => typeof tag === 'string')) {
        return res.status(400).json({ success: false, error: 'collaborationTags must be an array of strings.' });
      }
    }

    // Save feedback
    const feedback = new PeerFeedback({
      sourceEmployeeId,
      targetEmployeeId,
      date: new Date(),
      rating,
      collaborationTags: collaborationTags || []
    });

    await feedback.save();

    res.status(201).json({ success: true, message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/feedback/target/:employeeId
 * Protect + managerOnly middlewares ensure authorization
 */
export const getAggregatedFeedback = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify target employee exists
    const targetEmployee = await Employee.findById(employeeId);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, error: 'Target employee not found.' });
    }

    // Fetch all feedback for target
    const feedbackList = await PeerFeedback.find({ targetEmployeeId: employeeId });

    if (feedbackList.length === 0) {
      return res.json({
        success: true,
        data: {
          averageRating: null,
          uniqueTags: [],
          feedbackCount: 0
        }
      });
    }

    // Aggregate average rating
    let totalRating = 0;
    let ratingCount = 0;
    const allTags = new Set();

    for (const fb of feedbackList) {
      if (fb.rating !== undefined && fb.rating !== null) {
        totalRating += fb.rating;
        ratingCount++;
      }
      if (fb.collaborationTags && Array.isArray(fb.collaborationTags)) {
        fb.collaborationTags.forEach(tag => allTags.add(tag));
      }
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : null;

    res.json({
      success: true,
      data: {
        averageRating,
        uniqueTags: Array.from(allTags),
        feedbackCount: feedbackList.length
      }
    });
  } catch (error) {
    console.error('getAggregatedFeedback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/feedback/colleagues
 * Returns a basic list of colleagues for the dropdown
 */
export const getColleagues = async (req, res) => {
  try {
    const colleagues = await Employee.find({}, '_id name position');
    res.json({ success: true, data: colleagues });
  } catch (error) {
    console.error('getColleagues error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
