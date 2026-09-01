const { calculateDoctorAvailability } = require('../services/availabilityService');

// @desc    Get structured doctor availability slots for a given date
// @route   GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
// @access  Public / Authenticated
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" (YYYY-MM-DD) is required.',
      });
    }

    const availability = await calculateDoctorAvailability(doctorId, date);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};
