import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent } from "@mui/material";
import io from "socket.io-client";
import RecordRTC from "recordrtc";

const socket = io("http://localhost:5000");

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const videoRefs = useRef({});
  const screenRefs = useRef({});
  const recorders = useRef({}); // Store recorders for each student

  useEffect(() => {
    // Listen for webcam streams
    socket.on("receiveVideoStream", (data) => {
      if (!videoRefs.current[data.studentId]) {
        videoRefs.current[data.studentId] = React.createRef();
      }
      setStudents((prev) => {
        const existingStudent = prev.find((s) => s.studentId === data.studentId);
        if (existingStudent) {
          return prev.map((s) => (s.studentId === data.studentId ? { ...s, videoData: data.videoData } : s));
        }
        return [...prev, { studentId: data.studentId, videoData: data.videoData }];
      });
    });

    // Listen for screen sharing streams
    socket.on("receiveScreenStream", (data) => {
      if (!screenRefs.current[data.studentId]) {
        screenRefs.current[data.studentId] = React.createRef();
      }
      setStudents((prev) => {
        const existingStudent = prev.find((s) => s.studentId === data.studentId);
        if (existingStudent) {
          return prev.map((s) => (s.studentId === data.studentId ? { ...s, screenData: data.screenData } : s));
        }
        return [...prev, { studentId: data.studentId, screenData: data.screenData }];
      });
    });

    // Stop all recordings when the exam ends
    socket.on("stopRecording", () => {
      console.log("🛑 Exam ended. Stopping all recordings.");
      Object.keys(recorders.current).forEach((studentId) => {
        stopRecording(studentId);
      });
    });

    return () => {
      socket.off("receiveVideoStream");
      socket.off("receiveScreenStream");
      socket.off("stopRecording");
    };
  }, []);

  // Start recording webcam and screen
  const startRecording = (studentId) => {
    const videoElement = videoRefs.current[studentId]?.current;
    const screenElement = screenRefs.current[studentId]?.current;

    if (videoElement) {
      const recorder = new RecordRTC(videoElement.captureStream(), { type: "video" });
      recorder.startRecording();
      recorders.current[studentId] = recorder;
    }

    if (screenElement) {
      const recorder = new RecordRTC(screenElement.captureStream(), { type: "video" });
      recorder.startRecording();
      recorders.current[`${studentId}-screen`] = recorder;
    }

    console.log(`🎥 Recording started for Student ${studentId}`);
  };

  // Stop recording and save file
  const stopRecording = (studentId) => {
    const stopAndSave = (recorder, filename) => {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    if (recorders.current[studentId]) {
      stopAndSave(recorders.current[studentId], `student_${studentId}_exam.mp4`);
      delete recorders.current[studentId];
    }

    if (recorders.current[`${studentId}-screen`]) {
      stopAndSave(recorders.current[`${studentId}-screen`], `student_${studentId}_screen.mp4`);
      delete recorders.current[`${studentId}-screen`];
    }

    console.log(`✅ Recording saved for Student ${studentId}`);
  };

  return (
    <Container>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/cheating-reports">
            Cheating Reports
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Typography variant="h4" sx={{ mt: 4 }}>
        Live Student Monitoring
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {students.map((student) => (
          <Grid item xs={12} md={6} key={student.studentId}>
            <Card>
              <CardContent>
                <Typography variant="h6">Student {student.studentId}</Typography>
                {/* Webcam Video */}
                <video
                  ref={videoRefs.current[student.studentId]}
                  autoPlay
                  playsInline
                  style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
                />
                {/* Screen Share Video (if available) */}
                {student.screenData && (
                  <video
                    ref={screenRefs.current[student.studentId]}
                    autoPlay
                    playsInline
                    style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
                  />
                )}
                {/* Action Buttons */}
                <Button variant="contained" color="primary" sx={{ mt: 2, mr: 1 }} onClick={() => startRecording(student.studentId)}>
                  Start Recording
                </Button>
                <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={() => stopRecording(student.studentId)}>
                  Stop & Save
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
