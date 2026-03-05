import QuizAttempt from '../models/quizAttemptModel.js';
import Quiz from '../models/quizModel.js';
import AuthenticatedUser from '../models/authenticatedModel.js'
import Visitor from '../models/non-authenticatedModel.js';
import mongoose from 'mongoose';
import Session from '../models/sessionModel.js';

// For researchers: get stats about one of their quizzes
export const getQuizStats = async (req, res) => {
    try {
        const quizId = req.params.id;
        
        // Verify ownership
        const quiz = await Quiz.findById(quizId);
        if (!quiz || !quiz.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Basic stats
        const totalAttempts = await QuizAttempt.countDocuments({ quiz: quizId });
        const totalSessions = await Session.countDocuments({ quiz: quizId });
        const completedAttempts = await QuizAttempt.countDocuments({ 
            quiz: quizId, 
            completed: true 
        });
        const incompleteAttempts = totalSessions - completedAttempts;
        
        // Calculate average score
        const totalQuestions = quiz.questions.length;
        const scoreData = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId), completed: true } },
            { $group: { 
                _id: null, 
                avgScore: { $avg: { $divide: ['$score', totalQuestions] } }, // Normalize here
                minScore: { $min: { $divide: ['$score', totalQuestions] } },
                maxScore: { $max: { $divide: ['$score', totalQuestions] } }
            }}
        ]);
        
        // Demographics analysis
        const demographicsData = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId), 'demographics.ageGroup': { $exists: true } } },
            { $group: {
                _id: '$demographics.ageGroup',
                count: { $sum: 1 },
                totalScore: { $sum: '$score' }  // Sum of raw scores
            }},
            { $addFields: {
                avgScore: { $divide: ['$totalScore', '$count'] }  // Properly calculate average
            }},
            { $sort: { count: -1 } }
        ]);
        
        // Gender breakdown
        const genderData = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId), 'demographics.gender': { $exists: true } } },
            { $group: {
                _id: '$demographics.gender',
                count: { $sum: 1 }
            }}
        ]);
        
        // AI Familiarity breakdown
        const aiFamiliarityData = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId), 'demographics.aiExperience': { $exists: true } } },
            { $group: {
                _id: '$demographics.aiExperience',
                count: { $sum: 1 },
                totalScore: { $sum: '$score' }
            }},
            { $addFields: {
                avgScore: { $divide: ['$totalScore', '$count'] }
            }},
            { $sort: { count: -1 } }
        ]);
        
        // Question difficulty (which questions are most often wrong)
        const questionDifficultyData = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
            { $unwind: '$answers' },
            { $group: {
                _id: '$answers.question',
                totalAnswers: { $sum: 1 },
                correctAnswers: { 
                    $sum: { $cond: [{ $eq: ['$answers.isCorrect', true] }, 1, 0] }
                }
            }},
            { $project: {
                questionId: '$_id',
                difficultyRate: { 
                    $subtract: [1, { $divide: ['$correctAnswers', '$totalAnswers'] }]
                }
            }},
            { $sort: { difficultyRate: -1 } }
        ]);
        
        res.json({
            totalAttempts,
            completedAttempts,
            incompleteAttempts,
            totalQuestions,
            scores: scoreData[0] || { avgScore: 0, minScore: 0, maxScore: 0 },
            demographics: {
                ageGroups: demographicsData,
                gender: genderData,
                aiFamiliarity: aiFamiliarityData
            },
            questionDifficulty: questionDifficultyData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// For admin: platform-wide stats
export const getPlatformStats = async (req, res) => {

    try {
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        // Daily unique visitors for the last 7 days
        const dailyVisitors = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(now);
            day.setDate(day.getDate() - i);
            
            const startOfDay = new Date(day);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(day);
            endOfDay.setHours(23, 59, 59, 999);
            
            const uniqueVisitors = await Visitor.distinct('ipAddress', {
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            dailyVisitors.push({
                date: startOfDay.toISOString().split('T')[0],
                uniqueVisitors: uniqueVisitors.length
            });
        }

        // Get authenticated user accounts
        const researcherCount = await AuthenticatedUser.countDocuments({ role: 'researcher' });
        const adminCount = await AuthenticatedUser.countDocuments({ role: 'admin' });
        
        // Total quizzes
        const totalQuizzes = await Quiz.countDocuments();
        
        // Quizzes created in the last week
        const newQuizzes = await Quiz.countDocuments({
            createdAt: { $gte: oneWeekAgo }
        });
        
        // Published quizzes stats
        const totalPublishedQuizzes = await Quiz.countDocuments({ status: 'published' });
        const newPublishedQuizzes = await Quiz.countDocuments({
            status: 'published',
            createdAt: { $gte: oneWeekAgo }
        });
        
        // Platform load info (per-hour breakdown of backend requests)
        // For this we'd need request logging, simulating with quiz attempts
        const hourlyRequests = await QuizAttempt.aggregate([
            { $match: { createdAt: { $gte: oneWeekAgo } } },
            { $group: {
                _id: { 
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
            { $project: {
                _id: 0,
                date: { 
                    $dateToString: { 
                        format: '%Y-%m-%d %H:00', 
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day',
                                hour: '$_id.hour'
                            }
                        } 
                    } 
                },
                requests: '$count'
            }}
        ]);
        
        res.json({
            visitorStats: {
                dailyVisitors
            },
            userStats: {
                researchers: researcherCount,
                admins: adminCount
            },
            quizStats: {
                total: totalQuizzes,
                new: newQuizzes,
                totalPublished: totalPublishedQuizzes,
                newPublished: newPublishedQuizzes
            },
            platformLoad: hourlyRequests
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// For admin: get analytics on API requests
export const getRequestAnalytics = async (req, res) => {
    try {
        // In a production system, this would come from a request log
        // Here we'll simulate it with quiz attempt data
        const hourlyData = await QuizAttempt.aggregate([
            { $group: {
                _id: { 
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
        ]);
        
        res.json(hourlyData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};