const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Employee = require('../models/Employee');

exports.createAssessment = async (req, res) => {
  try {
    const { title, description, timeLimitMinutes } = req.body;
    const newAssessment = new Assessment({ title, description, timeLimitMinutes });
    await newAssessment.save();
    res.json({ success: true, data: newAssessment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { text, category, options, weight } = req.body;
    const assessmentId = req.params.id;
    
    const question = new Question({ assessmentId, text, category, options, weight });
    await question.save();
    res.json({ success: true, data: question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getAssessmentForStart = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });

    const questions = await Question.find({ assessmentId: req.params.id }).select('-options.isCorrect');
    
    res.json({ success: true, data: { assessment, questions } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.submitAssessmentAndGrade = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const answers = req.body.answers; 
    
    const questions = await Question.find({ assessmentId });
    if (!questions || questions.length === 0) return res.status(400).json({ success: false, error: 'No questions in this assessment' });

    let overallScore = 0;
    let maxPossibleScore = 0;
    const categoryScoresMap = {}; 

    questions.forEach(q => {
      maxPossibleScore += q.weight;
      
      if (!categoryScoresMap[q.category]) {
        categoryScoresMap[q.category] = { score: 0, max: 0 };
      }
      categoryScoresMap[q.category].max += q.weight;

      const submittedAnswer = answers.find(a => a.questionId.toString() === q._id.toString());
      if (submittedAnswer) {
        const selectedOption = q.options.find(opt => opt._id.toString() === submittedAnswer.selectedOptionId);
        if (selectedOption && selectedOption.isCorrect) {
          overallScore += q.weight;
          categoryScoresMap[q.category].score += q.weight;
        }
      }
    });

    const percentage = maxPossibleScore > 0 ? (overallScore / maxPossibleScore) * 100 : 0;
    
    const categoryScores = Object.keys(categoryScoresMap).map(cat => ({
      category: cat,
      score: categoryScoresMap[cat].score,
      maxScore: categoryScoresMap[cat].max
    }));

    // Find employee using User ID from JWT
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee profile missing' });

    const result = new Result({
      employeeId: employee._id, // References Employee Profile
      assessmentId,
      overallScore,
      maxPossibleScore,
      percentage,
      categoryScores,
      timeTakenMinutes: req.body.timeTakenMinutes || 0
    });

    await result.save();

    // Update performance score
    employee.performanceScore = employee.performanceScore > 0 
      ? Math.floor((employee.performanceScore + percentage) / 2)
      : Math.floor(percentage);
      
    await employee.save();

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
