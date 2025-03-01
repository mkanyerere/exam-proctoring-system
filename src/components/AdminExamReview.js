import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Paper } from "@mui/material";

const AdminExamReview = () => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/exams/answers")
      .then((res) => setSubmissions(res.data))
      .catch((err) => console.error("Error fetching submissions:", err));
  }, []);

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4 }}>
        📄 Exam Submissions
      </Typography>

      {submissions.length === 0 ? (
        <Typography variant="body1">No submissions yet.</Typography>
      ) : (
        submissions.map((submission, index) => (
          <Paper key={index} elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6">🆔 Student ID: {submission.studentId}</Typography>
            <Typography variant="body1">📅 Submitted on: {new Date(submission.submittedAt).toLocaleString()}</Typography>

            {/* Show MCQ Score */}
            {submission.score !== null ? (
              <Typography variant="h6">🎯 MCQ Score: {submission.score}%</Typography>
            ) : (
              <Typography variant="h6">📝 Waiting for grading...</Typography>
            )}

            <pre>{JSON.stringify(submission.answers, null, 2)}</pre>
          </Paper>
        ))
      )}
    </Container>
  );
};

export default AdminExamReview;
