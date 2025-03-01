import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Paper, Button } from "@mui/material";

const StudentExam = () => {
  const studentId = localStorage.getItem("userId");
  const [score, setScore] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/exams/results/${studentId}`)
      .then((res) => setScore(res.data.score))
      .catch((err) => console.error("Error fetching score:", err));
  }, []);

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4">📖 Exam Session</Typography>

        {score !== null ? (
          <Typography variant="h5">🎯 Your Score: {score}%</Typography>
        ) : (
          <Typography variant="h5">📝 Exam submitted. Awaiting results...</Typography>
        )}

        <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
          Refresh Score
        </Button>
      </Paper>
    </Container>
  );
};

export default StudentExam;
