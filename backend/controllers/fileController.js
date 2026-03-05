import File from '../models/fileModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Question from '../models/questionModel.js';
import Quiz from '../models/quizModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Upload a new file
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = await File.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            owner: req.user._id
        });

        res.status(201).json({
            id: file._id,
            filename: file.filename,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            createdAt: file.createdAt,
            url: `/uploads/${file.filename}`
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all files for the logged-in user
export const getMyFiles = async (req, res) => {
    try {
        const files = await File.find({ owner: req.user._id });
        
        const fileList = files.map(file => ({
            id: file._id,
            filename: file.filename,
            originalName: file.originalName,
            mimetype: file.mimetype,
            size: file.size,
            createdAt: file.createdAt,
            url: `/uploads/${file.filename}`
        }));
        
        res.json(fileList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a file
export const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        if (!file.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Find questions that use this file
        const fileUrl = `/uploads/${file.filename}`;
        const questions = await Question.find({ mediaUrls: fileUrl });
        let affectedQuestions = 0;
        
        // Delete each question that uses this file
        for (const question of questions) {
            // Find the quiz containing this question
            const quiz = await Quiz.findById(question.quiz);
            if (quiz) {
                // Remove question from the quiz
                quiz.questions = quiz.questions.filter(q => !q.equals(question._id));
                await quiz.save();
            }
            
            // Delete the question
            await question.deleteOne();
            affectedQuestions++;
        }
        
        // Delete the file from storage
        fs.unlinkSync(file.path);
        
        // Delete from database
        await file.deleteOne();
        
        res.json({ 
            message: 'File deleted successfully',
            affectedQuestions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};