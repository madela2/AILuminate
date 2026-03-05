import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import AuthenticatedUser from '../models/authenticatedModel.js';
import Visitor from '../models/non-authenticatedModel.js';
import Quiz from '../models/quizModel.js';
import Question from '../models/questionModel.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await AuthenticatedUser.deleteMany({});
    await Visitor.deleteMany({});
    await Quiz.deleteMany({});
    await Question.deleteMany({});

    // Create authenticated users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const researcherPassword = await bcrypt.hash('researcher123', 10);

    const admin = await AuthenticatedUser.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true
    });

    const researcher = await AuthenticatedUser.create({
      username: 'researcher',
      email: 'researcher@example.com',
      password: researcherPassword,
      role: 'researcher',
      isVerified: true
    });

    // Create a quiz
    const quiz = await Quiz.create({
      title: 'AI Image Recognition',
      description: 'Test your ability to spot AI-generated images',
      owner: researcher._id,
      status: 'published'
    });

    // Create questions
    const question1 = await Question.create({
      quiz: quiz._id,
      type: 'text',
      content: 'Which of these is likely an AI-generated term?',
      options: ['Machine Learning', 'Deep Learning', 'Synthetic Cognition', 'Neural Network'],
      correctIndex: 2,
      explanation: 'Synthetic Cognition is a made-up term that sounds AI-related but isn\'t a real field'
    });

    const question2 = await Question.create({
      quiz: quiz._id,
      type: 'text',
      content: 'Can AI truly understand humor?',
      options: ['Yes, completely', 'No, it\'s impossible', 'Partially, but with limitations', 'Only certain types'],
      correctIndex: 2,
      explanation: 'AI can recognize patterns in humor but lacks true understanding of cultural context and emotions'
    });

    // Add questions to quiz
    quiz.questions = [question1._id, question2._id];
    await quiz.save();

    // Create second quiz - AI Ethics
    const quiz2 = await Quiz.create({
      title: 'Spot the AI Art',
      description: 'Can you tell the difference between AI-generated and human-created visual content?',
      owner: researcher._id,
      status: 'published'
    });

    // Create questions for second quiz
    const q2question1 = await Question.create({
      quiz: quiz2._id,
      type: 'image',
      content: 'Which portrait was created by an AI?',
      mediaUrls: [
        '/uploads/AI1.jpg', 
        '/uploads/real1.jpg', 
        '/uploads/real2.jpg', 
        '/uploads/real3.jpg'
      ],
      options:[
        'Girl with brown hair and a smile',
        'Big smile girl with green shirt',
        'Old man smoking',
        'Old lady'
      ],
      correctIndex: 0,
      explanation: 'AI-generated portraits often have subtle inconsistencies in facial symmetry, unusual ear shapes, or unnatural hair patterns. The AI1.jpg shows these telltale signs, especially around the eyes and hairline.'
    })

    const q2question2 = await Question.create({
      quiz: quiz2._id,
      type: 'image',
      content: 'Which landscape image was taken by a human artist?',
      mediaUrls: [
        '/uploads/AI_landscape.webp',
        '/uploads/AI_landscape2.jpg',
        '/uploads/real_Landscape.jpg',
        '/uploads/AI_landscape3.jpg'
      ],
      options: [
        'Image 1',
        'Image 2',
        'Image 3',
        'Image 4'
      ],
      correctIndex: 2,
      explanation: 'Human-created landscape photographs typically show natural perspective, consistent lighting physics, and organic imperfections. AI-generated landscapes often contain subtle anomalies in reflections, shadows that don\'t properly align with light sources, and strange blending of textures at boundaries between objects like sky and mountains. The real landscape image demonstrates authentic depth perception and natural environmental elements that AI still struggles to render convincingly.'
    });

    const q2question3 = await Question.create({
      quiz: quiz2._id,
      type: 'image',
      content: 'This advertisement was created using:',
      mediaUrls: '/uploads/AI_advertisement.png',
      options: [
        'Traditional graphic design software', 
        'AI image generation', 
        'Professional photography with editing', 
        'Stock photos with overlays'
      ],
      correctIndex: 1,
      explanation: 'This image shows characteristic signs of AI generation: unusual text positioning, slightly warped product proportions, and an uncanny lighting quality that\'s difficult to achieve with traditional design methods.'
    });

    // Add questions to second quiz
    quiz2.questions = [q2question1._id, q2question2._id, q2question3._id];
    await quiz2.save();

    // Create third quiz - Future Technology Trends
    const quiz3 = await Quiz.create({
      title: 'Synthetic Media Detection',
      description: 'Learn to identify AI-generated audio and video content',
      owner: researcher._id,
      status: 'published'
    });

    // Create questions for third quiz
    const q3question1 = await Question.create({
      quiz: quiz3._id,
      type: 'audio',
      content: 'Listen to this clip. Is this voice human or AI-generated?',
      mediaUrls: '/uploads/AI_voice.mp3',
      options: [
        'Human voice actor', 
        'AI text-to-speech', 
        'Modified human recording', 
        'Professional voice synthesis'
      ],
      correctIndex: 1,
      explanation: 'This clip contains subtle signs of AI generation: perfectly consistent rhythm and intonation, lack of natural breathing patterns, and minimal variation in emotional tone that would be present in human speech.'
    });

    const q3question2 = await Question.create({
      quiz: quiz3._id,
      type: 'image',
      content: 'Is this a real cat eating ice cream?',
      mediaUrls: '/uploads/cat_eating_icecream.gif',
      options: [
        'Yes, this is a authentic footage', 
        'No this is AI created', 
        'No, this is a deepfake', 
        'No this ia a stock footage with voice overlay'
      ],
      correctIndex: 1,
      explanation: 'This is a IA created gif of a cat eating ice cream.'
    });

    const q3question3 = await Question.create({
      quiz: quiz3._id,
      type: 'audio',
      content: 'This musical piece was composed by:',
      mediaUrls: '/uploads/AI_music.mp3',
      options: [
        'A professional composer', 
        'An AI music generator', 
        'A music student', 
        'A collaborative human-AI process'
      ],
      correctIndex: 1,
      explanation: 'This composition shows hallmarks of AI-generated music: mathematically perfect timing, unusual chord progressions that follow patterns rather than emotional intent, and instrument sounds that lack the subtle imperfections of live performance.'
    });

    const q3question4 = await Question.create({
      quiz: quiz3._id,
      type: 'video',
      content: 'What about this video makes it not real?',
      mediaUrls: '/uploads/boy_running_flowerfield_balloon.mp4',
      options: [
        'His smile look fake',
        'It looks like he is flying',
        'This is real!'
      ],
      correctIndex: 1,
      explanation: 'This is an AI generated video. It looks like the boy is flying and walking on top of the flowers'
    });

     const q3question5 = await Question.create({
      quiz: quiz3._id,
      type: 'image',
      content: 'Which one of these is AI created?',
      mediaUrls: [
        '/uploads/Sopp.jpg',
        '/uploads/pink_flower.jpg',
      ],
      options: [
        'None of these are real!',
        'The flower is real',
        'The mushroom is real',
        'Both images is real!'
      ],
      correctIndex: 3,
      explanation: 'Both images are real and taken by a human using a mobile'
    });

     const q3question6 = await Question.create({
      quiz: quiz3._id,
      type: 'image',
      content: 'Which one of these are not real?',
      mediaUrls: [
        '/uploads/baklava.jpg',
        '/uploads/close-up-organic-olive-oil-olives.jpg',
      ],
      options: [
        'The baklava is not real',
        'The olive oil is real',
        'Both images is not real',
        'Both images are real'
      ],
      correctIndex: 3,
      explanation: 'These are stock foto of food, and taken by a human.'
    });

    // Add questions to third quiz
    quiz3.questions = [
      q3question1._id, 
      q3question2._id, 
      q3question3._id,
      q3question4._id,
      q3question5._id,
      q3question6._id
    ];
    await quiz3.save();

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();