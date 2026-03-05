/**
 * QuizPage component stories
 * 
 * The QuizPage displays individual quiz questions to users and handles
 * the selection, validation, and navigation between questions.
 */

import React from 'react';
import QuizPage from '../../publicpages/quizpage/QuizPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import axios from 'axios';

const mockQuiz = {
  title: 'Mock Quiz',
  questions: [
    {
      _id: 'q1',
      content: 'What is 2 + 2?',
      type: 'text',
      options: ['3', '4', '5'],
      explanation: 'Because 2 + 2 = 4',
    },
  ],
};

axios.get = () =>
  Promise.resolve({
    data: mockQuiz,
  });

export default {
  title: 'Pages/QuizPage',
  component: QuizPage,
  parameters: {
    docs: {
      description: {
        component: `
# QuizPage Component

The QuizPage component displays quiz questions to users and handles interaction.

## Features
- Displays various question types (text, image, video, audio)
- Handles answer selection and validation
- Shows explanations after answering
- Supports navigation between questions
- Inactivity timer with warning
- Responsive design for various devices

## Implementation Notes
- Uses React Router for question navigation
- Fetches quiz data from API
- Tracks user session and answers
- Provides feedback on answers
        `
      }
    }
  }
};

export const Default = () => (
  <MemoryRouter initialEntries={['/quizzes/123/sessions/abc/question/q1']}>
    <Routes>
      <Route
        path="/quizzes/:quizId/sessions/:sessionId/question/:questionId"
        element={<QuizPage />}
      />
    </Routes>
  </MemoryRouter>
);

Default.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // Wait for question to appear
  await waitFor(() => canvas.getByText(/what is 2 \+ 2\?/i));

  // Select answer "4"
  await userEvent.click(canvas.getByText('5'));

  // Wait for explanation to appear (use basic query check instead of Jest expect)
  await waitFor(() => {
    if (!canvas.queryByText(/because 2 \+ 2 = 4/i)) {
      throw new Error('Explanation did not appear after selecting an answer');
    }
  });
};
Default.parameters = {
  docs: {
    description: {
      story: 'This simulation shows a basic text question being answered. After selecting an option, an explanation appears.'
    }
  }
};

export const ImageQuestion = () => (
  <MemoryRouter initialEntries={['/quizzes/123/sessions/abc/question/q1']}>
    <Routes>
      <Route
        path="/quizzes/:quizId/sessions/:sessionId/question/:questionId"
        element={<QuizPage />}
      />
    </Routes>
  </MemoryRouter>
);
ImageQuestion.parameters = {
  mockData: {
    quiz: {
      title: 'Image Quiz',
      questions: [
        {
          _id: 'q1',
          content: 'Which image shows AI-generated content?',
          type: 'image',
          options: ['Image 1', 'Image 2', 'Image 3'],
          mediaUrls: ['/mock/image1.jpg', '/mock/image2.jpg', '/mock/image3.jpg'],
          explanation: 'Image 2 shows AI artifacts around the edges',
        },
      ],
    }
  },
  docs: {
    description: {
      story: 'This example demonstrates a question with image media options. Users can see multiple images and select the one that answers the question.'
    }
  }
};

export const Loading = () => (
  <MemoryRouter initialEntries={['/quizzes/123/sessions/abc/question/q1']}>
    <Routes>
      <Route
        path="/quizzes/:quizId/sessions/:sessionId/question/:questionId"
        element={<QuizPage />}
      />
    </Routes>
  </MemoryRouter>
);
Loading.parameters = {
  mockData: {
    loading: true
  },
  docs: {
    description: {
      story: 'This story shows the loading state of the QuizPage component while quiz data is being fetched.'
    }
  }
};

export const ErrorState = () => (
  <MemoryRouter initialEntries={['/quizzes/123/sessions/abc/question/q1']}>
    <Routes>
      <Route
        path="/quizzes/:quizId/sessions/:sessionId/question/:questionId"
        element={<QuizPage />}
      />
    </Routes>
  </MemoryRouter>
);
ErrorState.parameters = {
  mockData: {
    error: 'Failed to load quiz'
  },
  docs: {
    description: {
      story: 'This story demonstrates the error state when a quiz fails to load.'
    }
  }
};